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

const pickByDate = () => R.filter(R.both(
  R.pipe(
    R.prop('start'),
    moment,
    R.invoker(2, 'isSame')(moment(), 'day')
  ),
  R.has('end')
))

const durationToMinutes = ({ start, end }) => moment(end).diff(moment(start), 'minutes')

const readJson = reader => {
  let record = false
  const lines = []

  return new Promise(resolve => {
    reader.on('line', line => {
      if (/^\[/.test(line)) {
	record = true
      }

      if(record) {
	lines.push(line)
      }
    })

    reader.on('close', () => {
      resolve(JSON.parse(lines.join('')))
    })
  })
}

const formatMinutes = minutes => moment.duration(minutes, 'minutes').format('h[h] mm[m]')

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

readJson(reader)
  .then(pickByDate())
  .then(R.map(entry => ({
    ...entry,
    total: durationToMinutes(entry)
  })))
  .then(groupByTag)
  .then(R.reduce(
    (carry, items) => carry.concat({
      tags: items[0].tags,
      total: formatMinutes(sumTime(items)),
      rounded: formatMinutes(Math.round(sumTime(items) / 15, 0) * 15),
      hours: Math.round(sumTime(items) / 15, 0) * 15 / 60
    }),
    []
  ))
  .then(console.table)
  .catch(console.error)
