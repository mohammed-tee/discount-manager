import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const mockDiscounts = [
  {
    id: '1',
    name: 'Base one-time discount',
    discountValue: 250,
    editable: false,
    active: true,
    appliesTo: 'oneTime',
    valueType: 'amount',
    durationMonths: null,
    isUserAdded: false,
  },
  {
    id: '2',
    name: 'Editable monthly discount',
    discountValue: 5,
    editable: true,
    active: false,
    appliesTo: 'monthly',
    valueType: 'percentage',
    durationMonths: 3,
    isUserAdded: false,
  },
]

async function waitForInitialDiscountsToLoad() {
  await screen.findAllByText('Base one-time discount')
  await waitFor(() => {
    expect(screen.queryByText('Loading discounts...')).not.toBeInTheDocument()
  })
}

describe('discount workflows', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockDiscounts,
    })

    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('user-discount-id')
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('adds a manual discount and renders it with user actions', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitForInitialDiscountsToLoad()

    await user.click(screen.getByRole('button', { name: /add manual discount/i }))

    const discountInput = screen.getByLabelText('Discount')
    await user.clear(discountInput)
    await user.type(discountInput, '10')

    await user.type(screen.getByLabelText('Duration'), '6')
    await user.type(screen.getByLabelText('Description'), 'Promo 10%')

    await user.click(screen.getByRole('button', { name: /^add$/i }))

    const actionGroup = await screen.findByLabelText('actions for Promo 10%')
    expect(actionGroup).toBeInTheDocument()
    expect(screen.getByText('- 10 % monthly first 6 months')).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith('/discounts.json')
  })

  it('edits and deletes a user-added discount', async () => {
    const user = userEvent.setup()
    render(<App />)

    await waitForInitialDiscountsToLoad()

    await user.click(screen.getByRole('button', { name: /add manual discount/i }))
    await user.clear(screen.getByLabelText('Discount'))
    await user.type(screen.getByLabelText('Discount'), '10')
    await user.type(screen.getByLabelText('Description'), 'To be changed')
    await user.click(screen.getByRole('button', { name: /^add$/i }))

    const actionGroup = await screen.findByLabelText('actions for To be changed')

    await user.click(within(actionGroup).getByRole('button', { name: 'edit To be changed' }))

    const modalDiscountInput = screen.getByLabelText('Discount')
    await user.clear(modalDiscountInput)
    await user.type(modalDiscountInput, '8')

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(await screen.findByText('- 8 % monthly')).toBeInTheDocument()

    const updatedActionGroup = screen.getByLabelText('actions for To be changed')
    await user.click(within(updatedActionGroup).getByRole('button', { name: 'delete To be changed' }))

    await user.click(screen.getByRole('button', { name: /delete discount/i }))

    await waitFor(() => {
      expect(screen.queryByLabelText('actions for To be changed')).not.toBeInTheDocument()
    })
  })
})
