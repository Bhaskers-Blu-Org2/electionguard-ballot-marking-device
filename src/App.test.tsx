import React from 'react'
import ReactDOM from 'react-dom'
import { fireEvent, render, waitForElement } from 'react-testing-library'

import electionFile from './data/election.json'
const electionAsString = JSON.stringify(electionFile)

import App, { electionKey } from './App'

beforeEach(() => {
  window.localStorage.clear()
  window.location.href = '/'
})

it('renders without crashing', () => {
  const div = document.createElement('div')
  ReactDOM.render(<App />, div)
  ReactDOM.unmountComponentAtNode(div)
})

describe('loads election', () => {
  it(`via url hash and does't store in localStorage`, () => {
    window.location.href = '/#sample'
    const { getByText } = render(<App />)
    getByText('Get Started')
    expect(window.localStorage.getItem(electionKey)).toBeFalsy()
  })

  it(`from localStorage`, () => {
    window.localStorage.setItem(electionKey, electionAsString)
    const { getByText } = render(<App />)
    getByText('Get Started')
    expect(window.localStorage.getItem(electionKey)).toBeTruthy()
  })
})

it('end to end: election can be uploaded, voter can vote and print', async () => {
  /* tslint:disable-next-line */
  const eventListenerCallbacksDictionary: any = {}
  window.addEventListener = jest.fn((event, cb) => {
    eventListenerCallbacksDictionary[event] = cb
  })
  window.print = jest.fn(() => {
    eventListenerCallbacksDictionary.afterprint()
  })
  const { container, getByTestId, getByText } = render(<App />)
  expect(container).toMatchSnapshot()
  const fileInput = getByTestId('file-input')
  fireEvent.change(fileInput, {
    target: {
      files: [
        new File([JSON.stringify(electionFile)], 'election.json', {
          type: 'application/json',
        }),
      ],
    },
  })
  await waitForElement(() => getByText('Get Started'))
  expect(container).toMatchSnapshot()

  fireEvent.click(getByText('Get Started'))
  expect(container.firstChild).toMatchSnapshot()

  await waitForElement(() => getByText('President'))
  fireEvent.click(getByText('Minnie Mouse').closest('label') as HTMLElement)
  fireEvent.click(getByText('Mickey Mouse').closest('label') as HTMLElement)
  expect(container.firstChild).toMatchSnapshot()
  getByText(
    'To vote for Mickey Mouse, first uncheck the vote for Minnie Mouse.'
  )
  fireEvent.click(getByText('Okay'))
  expect(
    ((getByText('Minnie Mouse').closest('label') as HTMLElement).querySelector(
      'input'
    ) as HTMLInputElement).checked
  ).toBeTruthy()
  fireEvent.click(getByText('Next'))
  expect(container.firstChild).toMatchSnapshot()

  fireEvent.click(getByText('John Smith').closest('label') as HTMLElement)
  fireEvent.click(getByText('Chad Hanging').closest('label') as HTMLElement)
  expect(container.firstChild).toMatchSnapshot()
  getByText('To vote for Chad Hanging, first uncheck the vote for John Smith.')
  fireEvent.click(getByText('Okay'))
  expect(
    ((getByText('John Smith').closest('label') as HTMLElement).querySelector(
      'input'
    ) as HTMLInputElement).checked
  ).toBeTruthy()
  fireEvent.click(getByText('Review'))
  expect(container.firstChild).toMatchSnapshot()

  fireEvent.click(getByText('Print Ballot'))
  fireEvent.click(getByText('No. Go Back.'))
  fireEvent.click(getByText('Print Ballot'))
  fireEvent.click(getByText('Yes, I‘m finished. Print my ballot.'))
  expect(window.print).toBeCalled()

  await waitForElement(() => getByText('Get Started'))
})

describe('can start over', () => {
  it('when has no votes', async () => {
    window.localStorage.setItem(electionKey, electionAsString)
    const { getByText } = render(<App />)
    fireEvent.click(getByText('Get Started'))
    fireEvent.click(getByText('Settings'))
    fireEvent.click(getByText('Start Over'))
    expect(getByText('Get Started')).toBeTruthy()
  })
  it('when has votes', async () => {
    window.localStorage.setItem(electionKey, electionAsString)
    const { getByText } = render(<App />)
    fireEvent.click(getByText('Get Started'))
    fireEvent.click(getByText('Minnie Mouse').closest('label') as HTMLElement)
    fireEvent.click(getByText('Settings'))
    fireEvent.click(getByText('Start Over'))
    fireEvent.click(getByText('Cancel'))
    fireEvent.click(getByText('Start Over'))
    fireEvent.click(getByText('Yes, Remove All Votes and Start Over'))
    expect(getByText('Get Started')).toBeTruthy()
  })
})
