# 双指针 — 两个人的故事

> LeetCode 里最浪漫的算法思想，不是动态规划，而是双指针。

---

## 走廊里的两个人

想象一条长长的走廊，走廊两头各站着一个人——**小左**和**小右**。

如果只有一个人，他得从头走到尾，再从尾走到头，把所有组合都试一遍——这是 O(n²) 的暴力。但两个人一起，事情就不一样了。

**小左从左往右走，小右从右往左走**，他们根据线索决定谁该迈一步：

- 小左那边的值太小了？小左往右走一步，让值变大
- 小右那边的值太大了？小右往左走一步，让值变小
- 两人相遇？走廊搜完了

每一步都在缩小搜索范围，而不是盲目尝试。两个人走过的步数加起来，最多就是走廊的长度——O(n)。

这就是**对撞指针**。

---

## 盛水的容器 — 你们之间能装多少水？

> LeetCode 11. 盛最多水的容器

小左和小右各站在一根柱子旁边。两根柱子之间可以盛水，盛多少取决于**两根柱子较矮的那根**和**柱子之间的距离**。

```
水量 = min(左柱高, 右柱高) × 两柱距离
```

现在问题是：走廊里有很多柱子，哪两根之间能盛最多的水？

暴力做法是把所有柱子两两配对试一遍。但小左和小右更聪明——

1. 一开始他们站在走廊两端，距离最远
2. 算一下当前能盛多少水，记录下来
3. 然后**矮的那个人往中间走一步**——因为矮的那根柱子是瓶颈，距离又在缩小，不换矮柱子只会更差
4. 直到两人相遇

为什么矮的移动？因为水的高度由矮柱决定。保留矮柱、移动高柱——距离变小，高度不变或变小，一定更差。只有移动矮柱，高度才可能变高，才有**超越当前记录的可能**。

```js
function maxArea(height) {
  let left = 0, right = height.length - 1
  let max = 0

  while (left < right) {
    const water = Math.min(height[left], height[right]) * (right - left)
    max = Math.max(max, water)

    if (height[left] < height[right]) {
      left++
    } else {
      right--
    }
  }

  return max
}
```

每一步都能安全地排除一种可能性，所以不会错过答案。

---

## 三数之和 — 三个人的故事

> LeetCode 15. 三数之和

找三个数，加起来等于 0。

如果暴力枚举，三重循环 O(n³)。但我们可以把它变成"固定一个人，让另外两个人在走廊里找"：

1. 先把数组排序
2. 固定一个数 `nums[i]`，问题变成：在 `i` 后面的部分里，找两个数，使它们的和等于 `-nums[i]`
3. 这就是经典的两人走廊问题！

```js
function threeSum(nums) {
  nums.sort((a, b) => a - b)
  const result = []

  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue // 跳过重复

    let left = i + 1, right = nums.length - 1
    const target = -nums[i]

    while (left < right) {
      const sum = nums[left] + nums[right]
      if (sum === target) {
        result.push([nums[i], nums[left], nums[right]])
        while (left < right && nums[left] === nums[left + 1]) left++
        while (left < right && nums[right] === nums[right - 1]) right--
        left++
        right--
      } else if (sum < target) {
        left++
      } else {
        right--
      }
    }
  }

  return result
}
```

O(n²)，比 O(n³) 好得多。三个人的问题，拆成一个人站着不动 + 两个人在走廊里找。

---

## 移动零 — 一个在前面探路，一个在后面收拾

> LeetCode 283. 移动零

不是所有双指针都是面对面的。有时候两个人**朝同一个方向走**。

想象你在整理一排书架：你想把所有空位（零）移到最右边，非零的书保持原来的顺序。

**探路者**从左到右扫描每本书：
- 遇到一本有内容的书？交给**整理者**，整理者往右挪一格
- 遇到空位？跳过，继续往前探

探路者走得快，整理者走得慢。等探路者走完，整理者后面的位置全填上零。

```js
function moveZeroes(nums) {
  let slow = 0 // 整理者

  for (let fast = 0; fast < nums.length; fast++) { // 探路者
    if (nums[fast] !== 0) {
      [nums[slow], nums[fast]] = [nums[fast], nums[slow]]
      slow++
    }
  }
}
```

这就是**快慢指针**（同向双指针）：一个负责探索，一个负责安置。

---

## 相交链表 — 最浪漫的算法

> LeetCode 160. 相交链表

两条链表可能在某个节点交汇。怎么找到那个交汇点？

这道题有一个美到令人心碎的解法——

> 两个人分别从两条路出发，走到头后换到对方的路继续走。如果两条路有交汇点，他们一定会在交汇点相遇——因为他们走的总路程一样长。

假设链表 A 的独有部分长 a，链表 B 的独有部分长 b，公共部分长 c。

- 人 A 走的路：`a + c + b`
- 人 B 走的路：`b + c + a`

`a + c + b = b + c + a` —— 总路程一样，他们一定同时到达交汇点。

如果没有交汇点呢？两个人都走完 `a + b` 的路程后，同时到达 `null`，也算"相遇"了——在虚无中相遇，确认了彼此的路没有交集。

```js
function getIntersectionNode(headA, headB) {
  let a = headA, b = headB

  while (a !== b) {
    a = a === null ? headB : a.next
    b = b === null ? headA : b.next
  }

  return a
}
```

六行代码，证明了一个道理：**走过彼此走过的路，终会在某处相遇。**

---

## 环形链表 — 操场上的追逐

> LeetCode 141 & 142. 环形链表

两个人在操场上跑步。一个跑得快（每次走两步），一个跑得慢（每次走一步）。

如果跑道是直线，快的先到终点，两人不会相遇。
如果跑道有环，快的终究会**套圈**追上慢的——这就证明了环的存在。

```js
function hasCycle(head) {
  let slow = head, fast = head

  while (fast && fast.next) {
    slow = slow.next
    fast = fast.next.next
    if (slow === fast) return true
  }

  return false
}
```

更进一步，**找到环的入口**（142 题）：

当快慢指针在环内相遇时，让一个指针回到起点，两个指针都改为每次走一步。它们再次相遇的地方，就是环的入口。

为什么？设起点到环入口距离为 a，环入口到相遇点距离为 b，相遇点回到环入口距离为 c。

- 慢指针走了：`a + b`
- 快指针走了：`a + b + c + b`（多绕了一圈）
- 快指针速度是慢指针两倍：`2(a + b) = a + b + c + b`
- 化简：`a = c`

起点到环入口的距离 = 相遇点到环入口的距离。所以两个人各走一步，一定在环入口相遇。

```js
function detectCycle(head) {
  let slow = head, fast = head

  while (fast && fast.next) {
    slow = slow.next
    fast = fast.next.next

    if (slow === fast) {
      slow = head
      while (slow !== fast) {
        slow = slow.next
        fast = fast.next
      }
      return slow
    }
  }

  return null
}
```

---

## 接雨水 — 走廊的天花板有多高？

> LeetCode 42. 接雨水

这是双指针的终极考题。

每个位置能接多少雨水？取决于它左边最高的柱子和右边最高的柱子中**较矮的那根**，减去它自己的高度。

```
该位置的水量 = min(左边最高, 右边最高) - 自身高度
```

暴力做法是对每个位置分别向左向右扫描，O(n²)。

双指针怎么做？小左和小右还是从两端出发，各自维护自己那一侧见过的最高柱子：

- 如果 `leftMax < rightMax`：左边是瓶颈，当前左位置的水量确定了（由 leftMax 决定），小左往右走
- 如果 `rightMax ≤ leftMax`：右边是瓶颈，当前右位置的水量确定了，小右往左走

关键洞察：**较矮的那边，水位已经确定了**。不管另一边更远处还有什么，当前这边的水量不会变。

```js
function trap(height) {
  let left = 0, right = height.length - 1
  let leftMax = 0, rightMax = 0
  let water = 0

  while (left < right) {
    if (height[left] < height[right]) {
      leftMax = Math.max(leftMax, height[left])
      water += leftMax - height[left]
      left++
    } else {
      rightMax = Math.max(rightMax, height[right])
      water += rightMax - height[right]
      right--
    }
  }

  return water
}
```

---

## 双指针的本质

回顾这些题目，双指针的本质是什么？

**用两个位置的信息，安全地排除一大片搜索空间。**

| 类型 | 模式 | 典型场景 |
|------|------|----------|
| 对撞指针 | 两端向中间 | 有序数组找配对、盛水容器 |
| 快慢指针 | 同起点不同速 | 链表找环、找中点 |
| 同向指针 | 同方向不同速 | 原地移除、分区 |
| 交替指针 | 走完换路 | 链表相交 |

每一种都是两个人的合作：一个人的位置，为另一个人的决策提供了信息。

这就是为什么双指针比暴力快——不是因为走得快，而是因为**每一步都在做有意义的排除**。一个人孤军奋战，难免盲目；两个人配合，每一步都有方向。

> 算法如此，生活亦然。
