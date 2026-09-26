// Bounded reader for CA's declarative 9.0 configuration. Never evaluates Lua.
// Unknown syntax/helpers fail closed. Runtime listeners/rewards are not interpreted.
import { createHash } from 'node:crypto';
export const SOURCE_PATH = 'script/campaign/main_warhammer/';
export function tableAt(text, marker, calls = false) {
  let p = text.indexOf(marker); if (p < 0) throw Error(`Missing ${marker}`);
  p = text.indexOf('{', p + marker.length);
  function ws() { for (;;) { const m = text.slice(p).match(/^(?:\s+|--\[\[[\s\S]*?\]\]|--[^\n]*(?:\n|$))/); if (!m) break; p += m[0].length; } }
  function take(s) { ws(); if (!text.startsWith(s,p)) throw Error(`Expected ${s} at ${p}: ${text.slice(p,p+70)}`); p += s.length; }
  function value() {
    ws();
    if (text[p] === '{') {
      p++; const a=[],o={}; let keyed=false;
      for (;;) { ws(); if(text[p]==='}') {p++; return keyed ? o : a;}
        const id=text.slice(p).match(/^([A-Za-z_]\w*)\s*=/);
        if(id) {p+=id[0].length; o[id[1]]=value();keyed=true;}
        else if(text[p]==='[') {p++;const k=value();take(']');take('=');o[k]=value();keyed=true;}
        else a.push(value());
        ws(); if(',;'.includes(text[p])) p++; else if(text[p]!=='}') throw Error(`Expected comma at ${p}`);
      }
    }
    const s=text.slice(p).match(/^(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/);
    if(s) {p+=s[0].length;return s[0].slice(1,-1).replace(/\\([\\"'nrt])/g,(_,x)=>({n:'\n',r:'\r',t:'\t'}[x]??x));}
    const n=text.slice(p).match(/^-?\d+(?:\.\d+)?/);if(n){p+=n[0].length;return Number(n[0]);}
    const id=text.slice(p).match(/^[A-Za-z_]\w*/);if(!id)throw Error(`Unexpected data at ${p}: ${text.slice(p,p+80)}`);p+=id[0].length;
    if(['nil','true','false'].includes(id[0]))return {nil:null,true:true,false:false}[id[0]];
    if(calls && /^archaon_long_victory_(default_objectives_list|objective_destroy_factions_list)$/.test(id[0])) return {reference:id[0]};
    if(!calls || ! /^(generate_\w+_objective|province_key_list_from_region_group|region_key_list_from_region_group)$/.test(id[0]))throw Error(`Forbidden identifier ${id[0]}`);
    take('(');const args=[];ws();while(text[p]!==')'){args.push(value());ws();if(text[p]===',')p++;else break;}take(')');return {helper:id[0],args};
  }
  return value();
}
const truth = v => v !== false && v !== null && v !== undefined;
function expression(text,env) {
  text=text.trim();
  const parts=text.split(/\s+\.\.\s+/);if(parts.length>1)return parts.map(s=>expression(s,env)).join('');
  if(/^tostring\(/.test(text)){const v=expression(text.slice(9,-1),env);return v==null?'nil':String(v);}
  if(/^"[^"]*"$/.test(text))return text.slice(1,-1);
  if(/^\w+\[i\]$/.test(text))return env[text.slice(0,-3)]?.[env.i-1];
  if(text==='nil')return null;
  if(Object.hasOwn(env,text))return env[text];
  throw Error(`Unsupported helper expression: ${text}`);
}
function predicate(text,env) {
  if(text.includes(' and '))return text.split(' and ').every(s=>predicate(s,env));
  if(text.startsWith('not '))return !predicate(text.slice(4),env);
  if(/^is_table\(\w+\)$/.test(text))return Array.isArray(expression(text.slice(9,-1),env));
  if(text.endsWith(' ~= nil'))return expression(text.slice(0,-7),env)!=null;
  return truth(expression(text,env));
}
export function generateObjective(call,utils) {
  const match=utils.match(new RegExp('^'+call.helper+' = function\\(([^\\n]*)\\)\\r?\\n([\\s\\S]*?)^end','m'));
  if(!match)throw Error(`Missing helper ${call.helper}`);
  const params=match[1].split(',').map(s=>s.trim()).filter(Boolean),env=Object.fromEntries(params.map((s,i)=>[s,call.args[i]??null]));
  if(call.args.length>params.length)throw Error(`Extra helper arguments ${call.helper}`);
  let body=match[2].trim();
  if(body.startsWith('return {')) {
    // Only two used helpers return literal tables instead of insert statements.
    if(call.helper==='generate_SCRIPTED_COMPLETE_SHORT_VICTORY_objective')return {type:'SCRIPTED',conditions:['script_key complete_faction_victory','override_text mission_text_text_ie_attain_faction_victory'],boundaries:[]};
    if(call.helper==='generate_ALL_PLAYERS_RAZE_SACK_OR_OWN_X_SETTLEMENTS_objective')return {type:'ALL_PLAYERS_RAZE_SACK_OR_OWN_X_SETTLEMENTS',conditions:[`total ${env.amount}`],boundaries:[]};
    throw Error(`Unrecognized literal helper ${call.helper}`);
  }
  const lines=body.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('--'));
  const init=lines.shift().match(/^local objective = new_objective\("([A-Z_]+)"\)$/);if(!init)throw Error('Invalid helper initializer');
  const objective={type:init[1],conditions:[],boundaries:[]};
  function block(start,execute,stop=false) {
    let i=start;
    while(i<lines.length) {
      const l=lines[i];if(l==='end'||l.startsWith('elseif ')||l==='else')return i;
      if(l.startsWith('if ')) {
        let active=execute&&predicate(l.slice(3,-5),env);let taken=active;i=block(i+1,active);
        while(lines[i]?.startsWith('elseif ')){active=execute&&!taken&&predicate(lines[i].slice(7,-5),env);taken ||= active;i=block(i+1,active);}
        if(lines[i]==='else')i=block(i+1,execute&&!taken);
        if(lines[i]!=='end')throw Error('Unclosed helper if');i++;continue;
      }
      const loop=l.match(/^for i = 1, #(\w+) do$/);
      if(loop){const values=env[loop[1]];if(execute&&!Array.isArray(values))throw Error(`Non-array helper loop ${loop[1]}`);let end=block(i+1,false);if(execute)for(let j=0;j<values.length;j++){env.i=j+1;block(i+1,true);}i=end+1;continue;}
      const insert=l.match(/^table.insert\(objective.conditions, (.*)\)$/);
      if(insert){if(execute)objective.conditions.push(String(expression(insert[1],env)));i++;continue;}
      if(l==='amount = amount * cm:model():unit_size_multiplier()') {
        if(execute){objective.boundaries.push({kind:'runtime_unit_size_multiplier',base_amount:env.amount,expression:'base_amount * cm:model():unit_size_multiplier()'});env.amount=`${env.amount} * runtime_unit_size_multiplier`;}
        i++;continue;
      }
      if(l==='return objective'){i++;continue;}
      throw Error(`Unsupported helper statement ${l}`);
    }
    return i;
  }
  block(0,true);return objective;
}
export function readVictoryConfig(config,utils,playable, groups, archaon) {
  if(createHash('sha256').update(utils.replaceAll('\r\n','\n')).digest('hex')!=='50384f1aa0e07394113d2bcf49816636d3f0f8e1a357bc98abe89ab55d0ce0ca') throw Error('Unreviewed helper source revision');
  const data=tableAt(config,'\t\t_victory_objectives_ie_config =',true);
  const variantFactions=tableAt(config,'_victory_objectives_ie.factions_using_lord_as_variant_key =');
  // Reviewed subtype mapping, gated on the source dispatch and both configured keys.
  if(JSON.stringify(Object.keys(variantFactions))!==JSON.stringify(['wh_main_vmp_schwartzhafen']) || !config.includes('return faction_leader:character_subtype_key()'))throw Error('Unreviewed lord dispatch');
  const variants=['wh_dlc04_vmp_vlad_con_carstein','wh_pro02_vmp_isabella_von_carstein'];
  const rows=[];
  for(const faction of [...playable].sort())for(const variant of variantFactions[faction]?variants:[faction]) {
    const spec=data.factions[variant];if(!spec)throw Error(`No active config for ${variant}`);
    for(const tier of ['short','long','domination']) {
      if(spec[tier]?.objectives?.reference) {
        spec[tier].objectives=tableAt(archaon,'archaon_long_victory_default_objectives_list =',true);
        for(const call of spec[tier].objectives)call.args=call.args.map(a=>a?.reference?tableAt(archaon,a.reference+' ='):a);
      }
      if(!Array.isArray(spec[tier]?.objectives)||!spec[tier].objectives.length)throw Error(`No ${tier} objectives: ${variant}`);
      spec[tier].objectives.forEach((call,i)=>rows.push({faction,variant,tier,order:i+1,helper:call.helper,...generateObjective({...call,args:call.args.map(a=>a?.helper?groups(a.helper,a.args[0]):a)},utils)}));
    }
  }
  for(const row of rows) {
    if(row.type==='SCRIPTED')row.boundaries.push({kind:'scripted_completion',note:'Script key and configured thresholds retained; listener state/progress not evaluated.'});
    if(row.faction==='wh_main_chs_chaos'&&row.tier==='long')row.boundaries.push({kind:'dynamic_objectives_after_short_victory',note:'Initial configuration only; chosen-path objectives are added by wh3_dlc29_archaon_narrative.lua.'});
  }
  return rows;
}
