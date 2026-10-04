---
layout: post
title: 二叉树
date: 2026-09-29 12:07:00 +0800
last_modified_at: 2026-09-29 18:40:00 +0800
---

## 满二叉树和完全二叉树
1. 如果一棵二叉树只有度为0和度为2的结点，并且度为0的节点在同一层上，则这棵树为满二叉树
2. 在完全二叉树中，除了最底层结点没填满外，其余每层点数都达到最大值，并且最下面一层节点都集中在该层的最左侧的若干位置
- 优先队列的本质是一个堆，堆就是一棵完全二叉树。

## 二叉搜索树
1. 二叉搜索树有数值，是一个有序树
- 若它的左子树不空，则左子树的所有结点的值均小于它的根节点
- 若它的右子树不空，则右子树的所有结点的值均大于它的根节点
- 它的左右子树分别为二叉排序树
2. **平衡二叉搜索树**：它是一颗空树或者它的左右两个子树的高度差绝对值不超过1，并且两个子树都是一棵平衡二叉树。
- C++中map、set、multimap，multiset的底层实现都是平衡二叉搜索树，所以map、set的增删操作时间时间复杂度是logn
- 注意我这里没有说unordered_map、unordered_set，unordered_map、unordered_set底层实现是哈希表

## 二叉树的存储方式
1. 二叉树可以链式存储，也可以顺序存储

## 二叉树的递归遍历
1. 确定递归函数的参数和返回值： 确定哪些参数是递归的过程中需要处理的，那么就在递归函数里加上这个参数， 并且还要明确每次递归的返回值是什么进而确定递归函数的返回类型。

2. 确定终止条件： 写完了递归算法, 运行的时候，经常会遇到栈溢出的错误，就是没写终止条件或者终止条件写的不对，操作系统也是用一个栈的结构来保存每一层递归的信息，如果递归没有终止，操作系统的内存栈必然就会溢出。

3. 确定单层递归的逻辑： 确定每一层递归需要处理的信息。在这里也就会重复调用自己来实现递归的过程。
### 前序遍历/中序遍历/后序遍历
    ```cpp
    class BTOrder {
        void ptraversal(TreeNode *cur, vector<int>& vec) {
            if (cur == NULL) return;

            vec.push_back(cur->val); // 根
            ptraversal(cur->left, vec); // 左
            ptraversal(cur->right, vec); // 右
        }

        void itraversal(TreeNode *cur, vector<int>& vec) {
            if (cur == NULL) return;

            itraversal(cur->left, vec); // 左
            vec.push_back(cur->val); // 根
            itraversal(cur->right, vec); // 右
        }

        void btraversal(TreeNode *cur, vector<int>& vec) {
            if (cur == NULL) return;

            btraversal(cur->left, vec); // 左
            btraversal(cur->right, vec); // 右
            vec.push_back(cur->val); // 根
        }

        vector<int> preOrderTraversal(TreeNode *root) {
            vector<int> res;
            ptraversal(root, res);
            return res;
        }

        vector<int> inOrderTraversal(TreeNode *root) {
            vector<int> res;
            itraversal(root, res);
            return res;
        }

        vector<int> posterOrderTraversal(TreeNode *root) {
            vector<int> res;
            btraversal(root, res);
            return res;
        }
    };
    ```
## 二叉树的迭代遍历
### 前序遍历
- 因为前序遍历的出栈顺序应该是根左右，则入栈顺序应该是根右左
    ```cpp
    vector<int> preorderTraversal(TreeNode *root) {
        stack<TreeNode*> st;
        vector<int> res;
        if (root == nullptr) return res;
        st.push(root);
        while (st.size()) {
            TreeNode *node = st.top();
            st.pop();
            res.push_back(node);
            if (node->right) st.push(node->right);
            if (node->left) st.push(node->left);
        }
        return res;
    }
    ```

### 后序遍历
- 后续遍历只需要将前序遍历的入栈顺序调整，并且翻转结果即可
    ```cpp
    vector<int> postorderTraversal(TreeNode *root) {
        stack<TreeNode*> st;
        vector<int> res;
        if (root == nullptr) return res;
        st.push(root);
        while (st.size()) {
            TreeNode *node = st.top();
            st.pop();
            res.push_back(node);
            if (node->left) st.push(node->left);
            if (node->right) st.push(node->right);
        }
        reverse(res.begin(), res.end());
        return res;
    }
    ```
### 中序遍历
- 在使用迭代法写中序遍历时，就需要借用指针的遍历来帮助访问节点，栈用来处理节点上的元素
    ```cpp
    vector<int> inorderTraversal(TreeNode *root) {
        vector<int> res;
        stack<TreeNode*> st;
        TreeNode *cur = root;
        while (cur != NULL || !st.empty()) {
            if (cur != NULL) {
                st.push(cur);
                cur = cur->left; // left
            } else {
                cur = st.top();
                st.pop();
                res.push_back(cur->val); // mid
                cur = cur->right; // right
            }
        }
        return res;
    }
    ```

## 二叉树的层序遍历
- 队列先进先出，符合一层一层遍历的逻辑，而用栈先进后出适合模拟深度优先遍历也就是递归的逻辑。
### 递归法和非递归法
    ```cpp
    class Solution {
    public:
    // 非递归法，使用队列
        vector<vector<int>> levelOrder(TreeNode *root) {
            queue<TreeNode*> qu;
            if (root != NULL) qu.push(root);
            vector<vector<int>> res;
            while (qu.size()) {
                int sz = qu.size();
                vector<int> level;
                for (int i = 0; i < sz; ++i) {
                    TreeNode *node = qu.front();
                    qu.pop();
                    level.push_back(node->val);
                    if (node->left) qu.push(node->left);
                    if (node->right) qu.push(node->right);
                }
                res.push_back(level);
            }
            return res;
        }

        // 递归法
        void order(TreeNode *cur, vector<vector<int>> res, int depth) {
            if (cur == nullptr) return;

            if (res.size() == depth) res.push_back(vector<int>());
            res[depth].push_back(cur->val);

            order(cur->left, res, depth + 1);
            order(cur->right, res, depth + 1);
        }
        vector<vector<int>> levelOrder(TreeNode* root) {
            vector<vector<int>> res;
            int d = 0;
            order(root, res, d);
            return res;
        }
    }
    ```

### leetcode
1. 199 二叉树的右视图
- 给定一个二叉树的 根节点 root，想象自己站在它的右侧，按照从顶部到底部的顺序，返回从右侧所能看到的节点值。
    ```cpp
    vector<int> rightSideView(TreeNode* root) {
        if (root == NULL) return {};
        queue<TreeNode*> qu;
        vector<int> res;
        qu.push(root);
        while (qu.size()) {
            int sz = qu.size();
            for (int i = 0; i < sz; ++i) {
                TreeNode *node = qu.front();
                qu.pop();
                if (i == sz - 1) res.push_back(node->val);

                if (node->left) qu.push(node->left);
                if (node->right) qu.push(node->right);
            }
        }
        return res;
    }
    ```

2. 637. 二叉树的层平均值
    ```cpp
    vector<double> averageOfLevels(TreeNode* root) {
        queue<TreeNode*> qu;
        if (root != NULL)
            qu.push(root);
        vector<double> res;
        while (qu.size()) {
            int sz = qu.size();
            // sum is double
            double sum = 0;
            for (int i = 0; i < sz; ++i) {
                TreeNode* node = qu.front();
                qu.pop();
                sum += node->val;
                if (node->left)
                    qu.push(node->left);
                if (node->right)
                    qu.push(node->right);
            }
            res.push_back(sum / sz);
        }
        return res;
    }
    ```

3. 429. N 叉树的层序遍历
- 给定一个 N 叉树，返回其节点值的层序遍历。（即从左到右，逐层遍历）。
    ```cpp
    vector<vector<int>> levelOrder(Node* root) {
        queue<Node*> qu;
        if (root != NULL)
            qu.push(root);
        vector<vector<int>> res;
        while (qu.size()) {
            int sz = qu.size();
            vector<int> level;
            for (int i = 0; i < sz; ++i) {
                Node* node = qu.front();
                qu.pop();
                level.push_back(node->val);
                for (Node* child: node->children) {
                    qu.push(child);
                }
            }
            res.push_back(level);
        }
        return res;
    }
    ```