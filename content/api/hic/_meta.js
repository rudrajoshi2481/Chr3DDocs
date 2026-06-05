export default {
  '-- bulk': {
    type: 'separator',
    title: 'Bulk Hi-C',
  },
  HiCPipeline: 'HiCPipeline',
  HiCAligner: 'HiCAligner',
  HiCSamProcessor: 'HiCSamProcessor',
  HiCPairsProcessor: 'HiCPairsProcessor',
  HiCMatrixGenerator: 'HiCMatrixGenerator',
  HiCQCAnalyzer: 'HiCQCAnalyzer',
  FastqSplitter: 'FastqSplitter',
  '-- sn': {
    type: 'separator',
    title: 'Single-Nucleus Hi-C',
  },
  SnHiCPipeline: 'SnHiCPipeline',
  SnHiCCellQC: 'SnHiCCellQC',
  SnHiCPseudoBulk: 'SnHiCPseudoBulk',
  SnHiCOutputStructure: 'Output Structure',
}
