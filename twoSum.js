function twoSum(nums, target) {
    for(const [index, num] of nums.entries()){
        const complementIdx = nums.lastIndexOf(target-num)
        if(complementIdx > -1 && index != complementIdx){
            return [index, complementIdx]
        }
    }
}
// "answers": [
//  [0,1],
//  [1,2],
//  [0,1],
//  [3,4],
//  [0,3],
//  [2,4],
//  [1,2],
//  [2,3],
//  [0,2],
//  [0,4],
// ]