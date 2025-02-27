// Linked List 기반의 큐.
// 배열 기반의 큐를 만들려고 했지만.
// 배열을 다시 정렬할 필요 없이 인덱스를 조정하는 방식이라 더 효율적 이라고 판단.

export default class Queue {
  // 생성자 ( items, head, tail)
  constructor(maxSize) {
    this.items = [];
    this.head = 0;
    this.tail = 0;
    // this.maxSize = maxSize;
  }

  // 아이템 추가.
  enqueue(item) {
    this.items[this.tail++] = item;
  }

  // 아이템 꺼내기.
  dequeue() {
    if (this.isEmpty()) return null;
    const item = this.items[this.head];
    this.items.splice(this.head, 1); // 배열에서 첫 번째 항목 제거

    // 메모리 최적화: head가 일정 이상 커지면 배열을 재정리
    // if (this.head > this.maxSize) { 
    //   this.items = this.items.slice(this.head);
    //   this.tail -= this.head;
    //   this.head = 0;
    // }

    return item;
  }

  // 비어있는지 확인.
  isEmpty() {
    return this.head === this.tail;
  }

  // 전체 가져오고 비우기.
  dequeueAll() {
    if (this.isEmpty()) return [];
    const result = this.items.slice(this.head, this.tail);
    this.head = 0;
    this.tail = 0;
    this.items = []; // 배열 초기화
    return result;
  }

  // 테스트
  test() {
    console.log(this.items);
  }
}
