import { useEffect, useState } from 'react'
import DiscountPopup from './components/AddDiscountPopup/DiscountPopup'
import DeleteDiscount from './components/DeleteDiscount/DeleteDiscount'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'
import discountOverview from './assets/discountOverview.png'; 

const BASE_ONE_TIME_PRICE = 1000
const BASE_MONTHLY_PRICE = 10
const CONTRACT_MONTHS = 12
const INTRO_MONTHS = 3
const DISCOUNTS_ENDPOINT = '/discounts.json'
const PERMISSIONS = {
  addDiscount: true,
}

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
})

const formatCurrency = (value) => currencyFormatter.format(value)

const formatDiscountLabel = ({ discountValue, valueType, appliesTo, durationMonths }) => {
  const valueText = valueType === 'percentage' ? `${discountValue} %` : formatCurrency(discountValue)

  if (appliesTo === 'oneTime') {
    return `- ${valueText} one time`
  }

  if (durationMonths) {
    return `- ${valueText} monthly first ${durationMonths} months`
  }

  return `- ${valueText} monthly`
}

const calculateDiscountAmount = (basePrice, discount) => {
  if (discount.valueType === 'percentage') {
    return (basePrice * discount.discountValue) / 100
  }

  return discount.discountValue
}

const fetchDiscounts = async () => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const response = await fetch(DISCOUNTS_ENDPOINT)

  if (!response.ok) {
    throw new Error(`Failed to fetch discounts (${response.status})`)
  }

  return response.json()
}

const normalizeDiscount = (discount, index) => ({
  id: String(discount.id ?? crypto.randomUUID()),
  name: discount.name?.trim() || `Discount ${index + 1}`,
  discountValue: Number(discount.discountValue) || 0,
  editable: Boolean(discount.editable),
  active: Boolean(discount.active),
  appliesTo: discount.appliesTo === 'oneTime' ? 'oneTime' : 'monthly',
  valueType: discount.valueType === 'amount' ? 'amount' : 'percentage',
  durationMonths:
    discount.appliesTo === 'monthly' && discount.durationMonths !== '' && discount.durationMonths !== null
      ? Number(discount.durationMonths)
      : null,
  isUserAdded: Boolean(discount.isUserAdded),
})

function App() {
  const [discounts, setDiscounts] = useState([])
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(true)
  const [discountsError, setDiscountsError] = useState('')
  const [editPopup, setEditPopup] = useState(false)
  const [discountItem, setDiscountItem] = useState({})
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [discountToDelete, setDiscountToDelete] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadDiscounts = async () => {
      try {
        const data = await fetchDiscounts()

        if (!Array.isArray(data)) {
          throw new Error('Invalid discounts response')
        }

        if (isMounted) {
          setDiscounts(data.map((discount, index) => normalizeDiscount(discount, index)))
          setDiscountsError('')
        }
      } catch (error) {
        if (isMounted) {
          setDiscountsError('Could not load discounts. Please refresh and try again.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingDiscounts(false)
        }
      }
    }

    loadDiscounts()

    return () => {
      isMounted = false
    }
  }, [])

  const onEditDiscount = (item) => {
    setEditPopup(true)
    setDiscountItem(item)
  }

  const handleAddDiscount = ({ appliesTo, valueType, discountValue, durationMonths, description }) => {
    const numericDiscountValue = Number(discountValue)
    const parsedDuration = appliesTo === 'monthly' && durationMonths !== '' ? Number(durationMonths) : null

    const newDiscount = {
      id: crypto.randomUUID(),
      name: description?.trim(),
      discountValue: numericDiscountValue,
      editable: true,
      active: true,
      appliesTo,
      valueType,
      durationMonths: parsedDuration,
      isUserAdded: true,
    }

    setDiscounts((prev) => [...prev, newDiscount])
  }

  const handleUpdateDiscount = ({ id, appliesTo, valueType, discountValue, durationMonths, name }) => {
    const numericDiscountValue = Number(discountValue)
    const parsedDuration =
      appliesTo === 'monthly' && durationMonths !== '' && durationMonths !== null
        ? Number(durationMonths)
        : null

    setDiscounts((prev) =>
      prev.map((discount) => {
        if (discount.id !== id) {
          return discount
        }

        return {
          ...discount,
          name: name ?? discount.name,
          discountValue: numericDiscountValue,
          valueType,
          appliesTo,
          durationMonths: parsedDuration,
        }
      }),
    )
  }

  const handleDeleteDiscount = (id) => {
    setIsDeleteModalOpen(true);
    setDiscountToDelete(id);
  }

  const activeDiscounts = discounts.filter((discount) => discount.active)
  const activeOneTimeDiscounts = activeDiscounts.filter((discount) => discount.appliesTo === 'oneTime')
  const activeMonthlyDiscounts = activeDiscounts.filter((discount) => discount.appliesTo === 'monthly')

  const oneTimeDiscountTotal = activeOneTimeDiscounts.reduce(
    (sum, discount) => sum + calculateDiscountAmount(BASE_ONE_TIME_PRICE, discount),
    0,
  )

  const monthlyDiscountFirst3Months = activeMonthlyDiscounts.reduce(
    (sum, discount) => sum + calculateDiscountAmount(BASE_MONTHLY_PRICE, discount),
    0,
  )

  const monthlyDiscountRemainingMonths = activeMonthlyDiscounts
    .filter((discount) => !discount.durationMonths || discount.durationMonths > INTRO_MONTHS)
    .reduce((sum, discount) => sum + calculateDiscountAmount(BASE_MONTHLY_PRICE, discount), 0)

  const finalOneTimePrice = Math.max(BASE_ONE_TIME_PRICE - oneTimeDiscountTotal, 0)
  const finalMonthlyPriceFirst3 = Math.max(BASE_MONTHLY_PRICE - monthlyDiscountFirst3Months, 0)
  const finalMonthlyPriceRemaining = Math.max(BASE_MONTHLY_PRICE - monthlyDiscountRemainingMonths, 0)

  const firstThreeMonthsTotal = finalMonthlyPriceFirst3 * INTRO_MONTHS
  const remainingMonthsCount = CONTRACT_MONTHS - INTRO_MONTHS
  const remainingNineMonthsTotal = finalMonthlyPriceRemaining * remainingMonthsCount

  const formatDiscountImpact = (discount) => {
    const basePrice = discount.appliesTo === 'oneTime' ? BASE_ONE_TIME_PRICE : BASE_MONTHLY_PRICE
    const discountAmount = calculateDiscountAmount(basePrice, discount)

    if (discount.appliesTo === 'oneTime') {
      return `- ${formatCurrency(discountAmount)}`
    }

    if (discount.durationMonths) {
      return `- ${formatCurrency(discountAmount)} / month (${discount.durationMonths} months)`
    }

    return `- ${formatCurrency(discountAmount)} / month`
  }

  return (
    <main className="page">
      <section className="discounts-panel">
        <button className="prev-button top cursor-pointer" onClick={() => alert('Go to Previous page')}>Previous</button>
        <div className="discounts-card">
            <h2 className="card-title">Discounts</h2>
            <DiscountPopup
              baseOneTimePrice={BASE_ONE_TIME_PRICE}
              baseMonthlyPrice={BASE_MONTHLY_PRICE}
              canAddDiscount={PERMISSIONS.addDiscount}
              onAddDiscount={handleAddDiscount}
              onUpdateDiscount={handleUpdateDiscount}
              editPopup={editPopup}
              setEditPopup={setEditPopup}
              discountItem={discountItem}
            />
            <DeleteDiscount
              isDeleteModalOpen={isDeleteModalOpen}
              setIsDeleteModalOpen={setIsDeleteModalOpen}
              setDiscounts={setDiscounts}
              discountToDelete={discountToDelete}
            />
          <ul className="discount-list">
            {isLoadingDiscounts && <li className="discount-row">Loading discounts...</li>}
            {!isLoadingDiscounts && discountsError && <li className="discount-row">{discountsError}</li>}
            {!isLoadingDiscounts && !discountsError && discounts.map((item) => (
              <li key={item.id} className="discount-row">
                <span className="discount-name">{item.name}</span>
                <span className={`discount-value-wrap ${item.editable && !item.isUserAdded && 'editable'}`}>
                  {item.editable && !item.isUserAdded && <button onClick={() => onEditDiscount(item)} className="icon-action edit-icon cursor-pointer"><FontAwesomeIcon icon={faPen} /></button>}
                  <span className="discount-value">
                    {formatDiscountLabel({
                      discountValue: item.discountValue,
                      valueType: item.valueType,
                      appliesTo: item.appliesTo,
                      durationMonths: item.durationMonths,
                    })}
                  </span>
                </span>

                {item.isUserAdded ? (
                  <div className="row-actions" aria-label={`actions for ${item.name}`}>
                    <button
                      type="button"
                      className="icon-action cursor-pointer"
                      aria-label={`edit ${item.name}`}
                      onClick={() => onEditDiscount(item)}
                    >
                      <FontAwesomeIcon icon={faPen} className="row-icons"/>
                    </button>
                    <button
                      type="button"
                      className="icon-action cursor-pointer"
                      aria-label={`delete ${item.name}`}
                      onClick={() => handleDeleteDiscount(item.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} className="row-icons"/>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`toggle ${item.active ? 'active' : ''} cursor-pointer`}
                    aria-pressed={item.active}
                    aria-label={`toggle ${item.name}`}
                    onClick={() => {
                      setDiscounts((prev) =>
                        prev.map((discount) =>
                          discount.id === item.id ? { ...discount, active: !discount.active } : discount,
                        ),
                      )
                    }}
                  >
                    <span className="knob" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="card-footer">
            <button className="manual-discount-btn  cursor-pointer" onClick={() => alert('Go to Previous step')}>Previous</button>
            <button className="next-button cursor-pointer" onClick={() => alert('Go to Next step')}>Next</button>
          </div>
        </div>
      </section>

      <aside className="summary-panel">
        <div className="summary-top">
          <img src={discountOverview} alt="Overview" className="summary-image" />
          <h3 className="summary-title">Overview</h3>
          <div className="summary-row">
            <span>Webasto Pure II laadpaal type 2</span>
            <span>{formatCurrency(BASE_ONE_TIME_PRICE)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-row monthly-price">Maandelijkse prijs</span>
            <span>{formatCurrency(BASE_MONTHLY_PRICE)}</span>
          </div>
          <a href="#" className="link">Edit</a>
        </div>

        <div className="summary-middle">
          <span>Eventually per month excl. btw</span>
          <strong>{formatCurrency(finalMonthlyPriceFirst3)}</strong>
        </div>

        <div className="summary-bottom">
          <div className="summary-row">
            <span>Subtotal one-time costs excl. btw</span>
            <span>{formatCurrency(BASE_ONE_TIME_PRICE)}</span>
          </div>

          {activeDiscounts.length === 0 && (
            <div className="summary-row italic">
              <span>No active discounts</span>
              <span>{formatCurrency(0)}</span>
            </div>
          )}

          {activeDiscounts.map((discount) => (
            <div className="summary-row italic" key={discount.id}>
              <span>{discount.name}</span>
              <span>{formatDiscountImpact(discount)}</span>
            </div>
          ))}

          {activeMonthlyDiscounts.length > 0 && (
            <>
              <div className="summary-row total">
                <span>First {INTRO_MONTHS} months total</span>
                <span>{formatCurrency(firstThreeMonthsTotal)}</span>
              </div>

              <div className="summary-row total">
                <span>Remaining {remainingMonthsCount} months total</span>
                <span>{formatCurrency(remainingNineMonthsTotal)}</span>
              </div>
            </>
          )}

          <div className="summary-row total">
            <span>One-time costs excl. btw</span>
            <span>{formatCurrency(finalOneTimePrice)}</span>
          </div>
        </div>
      </aside>
    </main>
  )
}

export default App
