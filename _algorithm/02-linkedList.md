---
layout: post
title: 链表
date: 2026-10-02 11:20:00 +0800
last_modified_at: 2026-10-02 11:20:00 +0800
---

## 概念
1. 通过指针串联在一起的线性结构，每个节点由两部分组成一个是数据域一个是指针域
2. 链表分为：单链表、双链表、循环链表(用于解锁约瑟夫环问题)
3. 链表定义
    ```cpp
    struct ListNode {
        int val;
        ListNode *next;
        ListNode(int x) : val(x), next(nullptr) {}
    };
    // add node
    ListNode *head = new ListNode(0);
    // or
    ListNode *head = new ListNode();
    head->val = 0;
    ```

## 移出链表元素
- 给你一个链表的头节点 head 和一个整数 val ，请你删除链表中所有满足 Node.val == val 的节点，并返回 新的头节点 。
    ```cpp
    ListNode* removeElements(ListNode* head, int val) {
        ListNode *dummyNode = new ListNode(0);
        dummyNode->next = head;
        ListNode *cur = dummyNode;
        while (cur->next != nullptr) {
            if (cur->next->val == val) {
                cur->next = cur->next->next;
            } else {
                cur = cur->next;
            }
        }
        return dummyNode->next;
    }
    ```

## 设计链表(双向链表)
在链表类中实现这些功能：
- get(index)：获取链表中第 index 个节点的值。如果索引无效，则返回-1。
- addAtHead(val)：在链表的第一个元素之前添加一个值为 val 的节点。插入后，新节点将成为链表的第一个节点。
- addAtTail(val)：将值为 val 的节点追加到链表的最后一个元素。
- addAtIndex(index,val)：在链表中的第 index 个节点之前添加值为 val  的节点。如果 index 等于链表的长度，则该节点将附加到链表的末尾。如果 index 大于链表长度，则不会插入节点。如果index小于0，则在头部插入节点。
- deleteAtIndex(index)：如果索引 index 有效，则删除链表中的第 index 个节点。
    ```cpp
    struct DLinkListNode {
        int value;
        DLinkListNode *prev, *next;
        DLinkListNode(int v) : value(v), prev(nullptr), next(nullptr) {}
    };

    class MyLinkedList {
    public:
        MyLinkedList() {
            this->size = 0;
            this->head = new DLinkListNode(0);
            this->tail = new DLinkListNode(0);
            head->next = tail;
            tail->prev = head;
        }

        int get(int index) {
            if (index < 0 || index > size) return -1;
            DLinkListNode *cur;
            if (index + 1 < size - index) {
                cur = head;
                for (int i = 0; i <= index; ++i) {
                    cur = cur->next;
                }
            } else {
                cur = tail;
                for (int i = 0; i < size - index; ++i) {
                    cur = cur->prev;
                }
            }
            return cur->value;
        }

        void addAtHead(int val) {
            addAtIndex(0, val);
        }

        void addAtTail(int val) {
            addAtIndex(size, val);
        }

        void addAtIndex(int index, int val) {
            if (index > size) return;
            index = max(index, 0);
            DLinkListNode *pred, *succ;
            if (index < size - index) {
                pred = head;
                for (int i = 0; i < index; ++i) {
                    pred = pred->next;
                }
                succ = pred->next;
            } else {
                succ = tail;
                for (int i = 0; i < size - index; ++i) {
                    succ = succ->prev;
                }
                pred = succ->prev;
            }
            size++;
            DLinkListNode *addNode = new DLinkListNode(val);
            addNode->next = succ;
            addNode->prev = pred;
            pred->next = addNode;
            succ->prev = addNode;
        }

        void deleteAtIndex(int index) {
            if (index < 0 || index > size) return;
            DLinkListNode *pred, *succ;
            if (index < size - index) {
                pred = head;
                for (int i = 0; i < index; ++i) {
                    pred = pred->next;
                }
                succ = pred->next->next;
            } else {
                succ = tail;
                for (int i = 0; i < size - index; ++i) {
                    succ = succ->prev;
                }
                pred = succ->prev->prev;
            }
            size--;
            DLinkListNode *deleteNode = pred->next;
            pred->next = succ;
            succ->prev = pred;
            delete deleteNode;
        }

    private:
        int size;
        DLinkListNode *head;
        DLinkListNode *tail;
    };
    ```
