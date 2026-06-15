import { createHash } from 'crypto';

function sha256(data) {
  return createHash('sha256').update(String(data)).digest('hex');
}

export class MerkleTree {
  constructor(leavesData) {
    this.leaves = leavesData.map(d => {
      // Create a stable copy of the log entry without transient properties like proof/merkleRoot
      const cleanData = { ...d };
      delete cleanData.merkleRoot;
      delete cleanData.proof;
      delete cleanData.hash;
      return sha256(JSON.stringify(cleanData));
    });
    this.tree = [];
    this.buildTree();
  }

  buildTree() {
    let currentLevel = this.leaves;
    this.tree.push(currentLevel);

    while (currentLevel.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        nextLevel.push(sha256(left + right));
      }
      currentLevel = nextLevel;
      this.tree.push(currentLevel);
    }
  }

  getRoot() {
    if (this.tree.length === 0 || this.tree[0].length === 0) {
      return sha256('');
    }
    return this.tree[this.tree.length - 1][0] || sha256('');
  }

  getProof(index) {
    const proof = [];
    let currentIndex = index;

    for (let level = 0; level < this.tree.length - 1; level++) {
      const currentLevel = this.tree[level];
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < currentLevel.length) {
        proof.push({
          position: isRight ? 'left' : 'right',
          hash: currentLevel[siblingIndex]
        });
      } else {
        proof.push({
          position: 'right',
          hash: currentLevel[currentIndex]
        });
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }
}
