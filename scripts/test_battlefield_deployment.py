"""Deployment dependency and conditional-projection regressions."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
from build_battlefield_deployment import build, project_xz, ROOT, EVIDENCE

DECODER = Path(sys.argv.pop(1)).resolve() if len(sys.argv) > 1 else ROOT / 'work/battlefield-decoder-target/debug/ctw-battlefield-decoder'
IDENTITY = {f'm{i}{j}': float(i == j) for i in range(4) for j in range(4)}
TRIANGLE = [{'x': 0, 'y': 0}, {'x': 1, 'y': 0}, {'x': 0, 'y': 1}]


class DeploymentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(dir=ROOT / 'work')
        cls.addClassCleanup(cls.tmp.cleanup)
        cls.report = build(DECODER, Path(cls.tmp.name))

    def test_reproduce_source_report(self):
        self.assertEqual(self.report, json.loads((EVIDENCE / 'deployment-summary.json').read_bytes()))
        self.assertEqual(sum(a.get('roundtrip_byte_equal', False) for a in self.report['assets']), 8)
        failures = [a for a in self.report['assets'] if a['status'] == 'decoder_failed']
        self.assertEqual(len(failures), 1)
        self.assertTrue(failures[0]['source_asset'].endswith('catchment_20_layer_bmd_data.bin'))

    def test_resolved_dependencies_preserve_conditions(self):
        self.assertEqual(len(self.report['instances']), 5)
        self.assertTrue(all(i['status'] == 'conditional_projection_not_effective_geometry'
                            and not i['runtime_binding_verified'] for i in self.report['instances']))
        first = self.report['instances'][0]
        self.assertEqual(first['instance_uid'], 110966528067332153)
        self.assertEqual({p['zone_index'] for p in first['projected_boundaries']}, {0, 1})

    def test_direct_river_deployment_is_retained(self):
        river, = [a for a in self.report['assets'] if a['source_asset'].endswith('catchment_08_layer_bmd_data.bin')]
        self.assertEqual(len(river['native_boundaries']), 4)
        self.assertEqual({p['category'] for p in river['native_boundaries']}, {'DAC_RIVER'})

    def test_no_silent_clipping(self):
        first = self.report['instances'][0]['projected_boundaries']
        self.assertEqual([p['vertices_outside_parent_rectangle'] for p in first], [0, 6, 0, 6])
        self.assertEqual(min(p['x'] for p in first[1]['points']), 1056.0)

    def test_projection_convention(self):
        transform = {**IDENTITY, 'm30': 10, 'm31': 99, 'm32': 20}
        self.assertEqual(project_xz(TRIANGLE, transform),
                         [{'x': 10, 'y': 20}, {'x': 11, 'y': 20}, {'x': 10, 'y': 21}])
        transform.update(m00=0, m02=-1, m20=1, m22=0)
        self.assertEqual(project_xz(TRIANGLE, transform),
                         [{'x': 10, 'y': 20}, {'x': 10, 'y': 19}, {'x': 11, 'y': 20}])

    def test_unsupported_projection_rejected(self):
        for changes in [{'m01': 0.1}, {'m03': 1}, {'m33': 0}, {'m00': 0}, {'m30': float('nan')}]:
            with self.assertRaises(ValueError):
                project_xz(TRIANGLE, {**IDENTITY, **changes})
        with self.assertRaises(ValueError):
            project_xz(TRIANGLE, {})
        with self.assertRaises(ValueError):
            project_xz(TRIANGLE[:2], IDENTITY)

    def test_output_guard(self):
        for output in [EVIDENCE, Path(self.tmp.name)]:
            with self.assertRaises(ValueError):
                build(DECODER, output)


if __name__ == '__main__':
    unittest.main()
