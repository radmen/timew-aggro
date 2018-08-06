#!/usr/bin/env node

const readline = require('readline')
const R = require('ramda')
const moment = require('moment')

require('console.table')
require('moment-duration-format')(moment)

const groupByTag = R.pipe(
  R.groupBy(R.prop('tags')),
  R.values
)

const sumTime = R.pipe(
  R.map(R.prop('total')),
  R.sum
)

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

const stack = []
let currentDate = null

const readDate = line => {
  const [, date] = line.split(/ /)

  return date
}

const timeToSeconds = time => {
  const [hours, minutes, seconds] = time.split(':')

  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)
}

const sanitizeEntryLine = (rawTags, totalTime) => ({
  tags: rawTags.split(/,/)
    .map(R.trim)
    .join(', '),
  total: timeToSeconds(totalTime)
})

const readEntry = line => {
  const results = /^\s+(.+?)\s+(\d+:\d\d:\d\d)\s+((?:\d\d:\d\d:\d\d|-))\s+(\d{1,}:\d\d:\d\d)/.exec(line)

  if (!results) {
    return sanitizeEntryLine('chuj', '0:00:00')
  }

  const [, rawTags, , , totalTime] = results

  return sanitizeEntryLine(rawTags, totalTime)
}

const readHeaderEntry = R.pipe(
  // hack: just replace header (first row for given date) information with some space
  R.replace(/^W\d+\s+\d{4}-\d{2}-\d{2}\s+\w{3}/i, ' '),
  readEntry
)

const aggegateEntries = entries => {
  const grouped = groupByTag(entries)

  return grouped.reduce(
    (carry, items) => carry.concat({
      tags: items[0].tags,
      total: moment.duration(sumTime(items), 'seconds').format('h[h] mm[m]')
    }),
    []
  )
}

const aggregateStack = stack => ({
  ...stack,
  entries: aggegateEntries(stack.entries)
})

reader.on('line', line => {

  if (line === '' || /^\s+\d{1,}:\d\d:\d\d$/.test(line)) {
    currentDate = null

    return
  }

  if (/^Wk/.test(line)) {
    return
  }

  if (/^W\d+/.test(line)) {
    currentDate = {
      date: readDate(line),
      entries: [readHeaderEntry(line)]
    }

    stack.push(currentDate)

    return
  }

  if (/^\s+\w+/.test(line)) {
    currentDate.entries.push(readEntry(line))
  }
})

reader.on('close', () => {
  const summary = stack.map(aggregateStack)

  summary.forEach(stack => {
    console.log(stack.date)
    console.log('-'.padStart(stack.date.length, '-'))
    console.log('')

    console.table(stack.entries)
  })
})
