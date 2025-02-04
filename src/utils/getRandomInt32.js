function getRandomInt32() {
  // int32 최댓값 = 2147...
  return Math.floor(Math.random() * 2147483648);
}

export default getRandomInt32;
