"""Contract mutation tests: reject authority, identity and provenance regressions."""
import copy
import unittest
from validate_architecture import ROOT, read, validate


class ArchitectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.inputs = [read(ROOT, p) for p in ['context_catalog.json', 'docs/dataset_connections.json', 'docs/development_inventory.json']]

    def check_mutation(self, mutate, expected):
        args = copy.deepcopy(self.inputs)
        mutate(*args)
        with self.assertRaisesRegex(ValueError, expected):
            validate(ROOT, *args, check_docs=False)

    def test_current_contract_and_generated_views(self):
        self.assertEqual(validate(ROOT, *self.inputs)['status'], 'passed')

    def test_development_cannot_enter_production(self):
        self.check_mutation(lambda c, r, i: c['datasets'].update(cold_mires_hypothesis=c['development_datasets']['cold_mires_hypothesis']), 'development in production')

    def test_wrong_owner_rejected(self):
        self.check_mutation(lambda c, r, i: r['endpoints']['ability_bindings'].update(owner='magic'), 'canonical owner/path mismatch')

    def test_nonexistent_csv_key_rejected(self):
        self.check_mutation(lambda c, r, i: r['endpoints']['weapon_links']['fields'].append('invented_key'), 'missing fields')

    def test_nonexistent_sqlite_column_rejected(self):
        self.check_mutation(lambda c, r, i: r['endpoints']['army_starts']['fields'].append('movement_turns'), 'missing SQLite')

    def test_native_schema_mismatch_rejected(self):
        self.check_mutation(lambda c, r, i: r['endpoints']['ability_bindings'].update(schema_table='unit_abilities_tables'), 'native schema owner/path')

    def test_missing_join_endpoint_rejected(self):
        self.check_mutation(lambda c, r, i: r['connections'][0]['joins'][0].update(to='missing'), 'join endpoint outside')

    def test_duplicate_connection_rejected(self):
        self.check_mutation(lambda c, r, i: r['connections'].append(r['connections'][0]), 'duplicate connection')

    def test_unresolved_cannot_claim_production(self):
        self.check_mutation(lambda c, r, i: next(x for x in r['connections'] if x['id']=='campaign-capability-routes').update(status='production'), 'proposed owner cannot advertise')

    def test_mutable_source_pin_rejected(self):
        self.check_mutation(lambda c, r, i: i['records'][0].update(commit='main'), 'immutable commit')

    def test_path_escape_rejected(self):
        self.check_mutation(lambda c, r, i: r['endpoints']['weapon_links'].update(path='../elsewhere.csv'), 'escapes repository')

    def test_missing_evidence_rejected(self):
        self.check_mutation(lambda c, r, i: r['connections'][0]['evidence'].append('docs/missing.json'), 'missing local reference')

    def test_discovery_cannot_target_production(self):
        self.check_mutation(lambda c, r, i: c['development_discovery']['routes'][0].update(dataset='units'), 'target a development dataset')

    def test_discovery_cannot_silently_feed_predictions(self):
        self.check_mutation(lambda c, r, i: c['development_discovery']['routes'][0].update(automatic_prediction_input=True), 'silently feed predictions')

    def test_runtime_evidence_is_independent_of_lifecycle(self):
        for lifecycle in ['production_main', 'source_branch', 'open_pr', 'closed_unmerged']:
            with self.subTest(lifecycle=lifecycle):
                args = copy.deepcopy(self.inputs)
                item = args[2]['records'][0]
                item['lifecycle'] = lifecycle
                item['evidence_levels'].append('runtime_verified')
                item['evidence_claims'] = [{'level':'runtime_verified',
                    'scope':'Synthetic validator fixture only', 'method':'Synthetic fixture',
                    'limitations':'No real empirical claim', 'artifact':{
                        'repository':item['repository'], 'commit':item['commit'], 'path':item['path']}}]
                self.assertEqual(validate(ROOT, *args, check_docs=False)['status'], 'passed')

    def test_high_evidence_claim_requires_support_even_on_main(self):
        self.check_mutation(lambda c, r, i: i['records'][0]['evidence_levels'].append('runtime_verified'), 'scoped evidence claim required')

    def test_guide_drift_rejected(self):
        args=copy.deepcopy(self.inputs)
        args[1]['connections'][0]['conditions'] += ' drift'
        with self.assertRaisesRegex(ValueError, 'generated guide drift'):
            validate(ROOT, *args)


if __name__ == '__main__':
    unittest.main()
