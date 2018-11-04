const code = `function main({util}, array, metadata) {
  if (isEmpty(array)) {
    return array
  }
  const meta = {}
  Object.keys(metadata || {}).forEach(key => {
    const cfg = metadata[key]
    if (typeof cfg.format === 'string') {
      if (/[ymdhs]/i.test(cfg.format)) {
        cfg.fmt = function(value) {
          return fmtDate(value, cfg.format)
        }
      } else {
        cfg.fmt = function(value) {
          return fmtNum(value, cfg.format)
        }
      }
    }
    meta[key] = cfg
  })
  const header = []
  Object.keys(array[0]).forEach(key => {
    header.push(Object.assign({
      name: key,
      isVisible: true,
    }, meta[key]))
  })
  const dataList = []
  array.forEach(row => {
    const rowData = []
    header.forEach(h => {
      const col = {
        value: row[h.name],
        showValue: row[h.name],
      }
      if (meta[h.name] && meta[h.name].fmt) {
        col.showValue = meta[h.name].fmt(col.value)
      }
      rowData.push(col)
    })
    dataList.push({ rowData })
  })
  return {
    header,
    dataList,
  }
 }
 
 function defFmt(value) {
  return value
 }
 `
 
 module.exports = {
   code,
 }