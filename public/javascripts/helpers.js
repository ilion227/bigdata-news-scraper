module.exports = {
  splitInfo: function(info, index) {
    const split = info.split('|');

    if (index >= split.length) {
      return split[split.length - 1];
    }
    return split[index];
  },
};