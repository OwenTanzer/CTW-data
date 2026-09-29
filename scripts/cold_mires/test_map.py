import json
import unittest
from pathlib import Path
import numpy as np
from query_map import Map,contains,intersects_box

class Checks(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.m=Map()
    def test_geometry_edges_and_concavity(self):
        poly=[[0,0],[3,0],[3,1],[1,1],[1,3],[0,3]]
        self.assertEqual(contains([[0,0],[.5,2],[2,2],[4,0],[1,2]],poly).tolist(),[True,True,False,False,True])
        self.assertTrue(intersects_box(poly,[.2,1.5,.8,2.5]))
        self.assertFalse(intersects_box(poly,[1.5,1.5,2.5,2.5]))
    def test_coordinate_edges(self):
        self.assertEqual(self.m.point(1088,1536)['sample']['row'],0)
        q=self.m.point(2047.99,2559.99)
        self.assertEqual((q['sample']['column'],q['sample']['row']),(479,511))
        for x,z in [(2048,1800),(1200,2560),(1087,1536),(float('nan'),1700)]:
            with self.assertRaises(ValueError): self.m.point(x,z)
    def test_region_and_coverage(self):
        s=self.m.region([1088,1536,2048,2560])
        self.assertEqual(s['sample_count'],512*480)
        self.assertEqual(sum(s['water_sample_counts'].values()),s['sample_count'])
        self.assertEqual(len(s['candidate_blockage_ids_intersecting_closed_box']),19)
        self.assertEqual(s['vegetation_counts'],dict(spruce=627,reed=602,other=76))
        self.assertEqual(sum(s['water_by_blockage_sample_counts'].values()),s['samples_in_candidate_blockages'])
    def test_native_calibration(self):
        for key,lo,hi in [('ground',-68.49610137939453,896.697509765625),('water',-1000.,62.41474151611328)]:
            np.testing.assert_allclose(self.m.r[key],lo+self.m.r['raw_'+key].astype(float)/65535*(hi-lo),rtol=0,atol=1e-10)
    def test_unknown_remains_unknown(self):
        row,col=np.argwhere(self.m.r['raw_water']==0)[0]
        q=self.m.point(1088+2*col,1536+2*row)
        self.assertEqual(q['water']['classification'],'coverage_unknown')
        self.assertIsNone(q['water']['depth_native'])
        self.assertEqual(q['passability'],'unknown')
        json.dumps(q,allow_nan=False)
    def test_empty_sample_region(self):
        s=self.m.region([1088.1,1536.1,1088.2,1536.2])
        self.assertEqual(s['sample_count'],0)
        self.assertIsNone(s['ground_native_range'])

if __name__=='__main__': unittest.main()
