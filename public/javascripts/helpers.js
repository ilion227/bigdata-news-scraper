module.exports = {
  splitInfo: function(info, index) {
    console.log('SPLITTING', info);
    var split = info.split('|');

    if (index >= split.length) {
      return split[split.length - 1];
    }
    return split[index];
  },
};