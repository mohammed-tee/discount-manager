import { useEffect, useMemo, useState } from 'react'
import './DiscountPopup.css'
import '../../index.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle, faSortDown } from '@fortawesome/free-solid-svg-icons'
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons/faCircleCheck'

export default function DiscountPopup({
    baseOneTimePrice,
    baseMonthlyPrice,
    onAddDiscount,
    onUpdateDiscount,
    editPopup,
    discountItem,
    setEditPopup,
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [appliesTo, setAppliesTo] = useState('monthly')
    const [valueType, setValueType] = useState('percentage')
    const [discountValue, setDiscountValue] = useState('5')
    const [durationMonths, setDurationMonths] = useState('')
    const [description, setDescription] = useState('')

    const basePrices = {
        oneTime: baseOneTimePrice,
        monthly: baseMonthlyPrice,
    }

    const newPrice = useMemo(() => {
        const basePrice = basePrices[appliesTo]
        const value = Number(discountValue) || 0

        const discountAmount = valueType === 'percentage'
            ? (basePrice * value) / 100
            : value

        return Math.max(basePrice - discountAmount, 0)
    }, [appliesTo, discountValue, valueType])

    const formattedPrice = new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
    }).format(newPrice)

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('active-modal')
        } else {
            setEditPopup(false);
            document.body.classList.remove('active-modal')
        }

        return () => {
            document.body.classList.remove('active-modal')
        }
    }, [isOpen])


    useEffect(() => {
        if (editPopup) {
            setIsOpen(true)
            setAppliesTo(discountItem.appliesTo ?? 'monthly')
            setValueType(discountItem.valueType ?? 'percentage')
            setDiscountValue(String(discountItem.discountValue ?? ''))
            setDurationMonths(discountItem.durationMonths ? String(discountItem.durationMonths) : '')
            setDescription(discountItem.name ?? '')
        }
    }, [editPopup, discountItem])

    const resetForm = () => {
        setAppliesTo('monthly')
        setValueType('percentage')
        setDiscountValue('5')
        setDurationMonths('')
        setDescription('')
    }

    const handleDiscountValueChange = (event) => {
        const nextValue = event.target.value

        if (nextValue === '') {
            setDiscountValue('')
            return
        }

        if (!/^\d*\.?\d*$/.test(nextValue)) {
            return
        }

        if (editPopup) {
            const maxValue = Number(discountItem.discountValue)
            const numericValue = Number(nextValue)

            if (Number.isFinite(maxValue) && Number.isFinite(numericValue) && numericValue > maxValue) {
                return
            }
        }

        setDiscountValue(nextValue)
    }

    const togglePopup = () => {
        setIsOpen((prev) => !prev)
        resetForm()
    }

    const handleSubmitDiscount = () => {
        const parsedValue = Number(discountValue)
        const parsedDuration = Number(durationMonths)

        if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
            return
        }

        if (appliesTo === 'monthly' && durationMonths !== '' && (!Number.isInteger(parsedDuration) || parsedDuration <= 0)) {
            return
        }

        if (editPopup) {
            onUpdateDiscount?.({
                id: discountItem.id,
                appliesTo,
                valueType,
                discountValue: parsedValue,
                durationMonths: appliesTo === 'monthly' && durationMonths !== '' ? parsedDuration : null,
                name: discountItem.name,
            })
        } else {
            onAddDiscount({
                appliesTo,
                valueType,
                discountValue: parsedValue,
                durationMonths: appliesTo === 'monthly' && durationMonths !== '' ? parsedDuration : null,
                description,
            })
        }

        resetForm()
        setIsOpen(false)
    }

    return (
        <>
        <div className="card-toolbar">
            <button className="manual-discount-btn cursor-pointer" type="button" onClick={togglePopup}>
              <span className="plus">+</span>
              Add manual discount
            </button>
          </div>
        {isOpen && (
        <div className="modal">
            <div className="overlay" onClick={togglePopup}></div>
            <div className="modal-content">
                <h2 className="modal-title">{editPopup ? discountItem.name : 'Add discount'}</h2>

                <p className="modal-label">For which price do you calculate the discount?</p>
                <div className="price-type-switch">
                    <button
                        type="button"
                        className={`switch-option ${appliesTo === 'oneTime' && !editPopup ? 'selected' : editPopup && discountItem.appliesTo === 'oneTime' ? 'selected' : ''}`}
                        onClick={() => setAppliesTo('oneTime')}
                        disabled={editPopup}
                    >
                        One time price
                        <span>{appliesTo === 'oneTime' && !editPopup ? <FontAwesomeIcon className='switch-dot' icon={faCircleCheck} /> : editPopup && discountItem.appliesTo === 'oneTime' ? <FontAwesomeIcon className="switch-dot" icon={faCircleCheck} /> : <FontAwesomeIcon className="switch-dot" icon={faCircle} />}</span>
                    </button>
                    <button
                        type="button"
                        className={`switch-option ${appliesTo === 'monthly' && !editPopup ? 'selected' : editPopup && discountItem.appliesTo === 'monthly' ? 'selected' : ''}`}
                        onClick={() => setAppliesTo('monthly')}
                        disabled={editPopup}
                    >
                        Monthly price
                        <span>{appliesTo === 'monthly' && !editPopup ? <FontAwesomeIcon className='switch-dot' icon={faCircleCheck} /> : editPopup && discountItem.appliesTo === 'monthly' ? <FontAwesomeIcon className="switch-dot" icon={faCircleCheck} /> : <FontAwesomeIcon className="switch-dot" icon={faCircle} />}</span>
                    </button>
                </div>

                <label className="modal-field-label" htmlFor="discount-value">Discount</label>
                <div className="inline-field">
                    <div className="discount-type-select-wrap">
                        <select
                            className="discount-type-select"
                            value={valueType}
                            disabled={editPopup}
                            onChange={(event) => setValueType(event.target.value)}
                        >
                            <option value="percentage">%</option>
                            <option value="amount">€</option>
                        </select>
                        <span className="discount-type-arrow" aria-hidden="true">
                            <FontAwesomeIcon className="discount-type-arrow-icon" icon={faSortDown} />
                        </span>
                    </div>
                    <input
                        id="discount-value"
                        className="modal-input"
                        value={discountValue}
                        style={{ width: '658px', marginLeft: '4px' }}
                        onChange={handleDiscountValueChange}
                    />
                    {editPopup && (<p className="max-discount">The discount cannot exceed {discountItem.discountValue} {discountItem.valueType === 'percentage' ? '%' : '€'}</p>)}
                </div>
                {!editPopup && (
                <>
                    <label className="modal-field-label" htmlFor="discount-duration">Duration</label>
                    <div className="suffix-field">
                        <input
                            id="discount-duration"
                            className="modal-input"
                            value={durationMonths}
                            disabled={appliesTo === 'oneTime'}
                            onChange={(event) => setDurationMonths(event.target.value)}
                            placeholder='Number of months'
                        />
                    </div>
                </>
                )}

                <label className="modal-field-label" htmlFor="new-price">New price</label>
                <input
                    id="new-price"
                    className="modal-input"
                    value={formattedPrice}
                    readOnly
                />
                {!editPopup && (
                    <>
                        <label className="modal-field-label" htmlFor="description" style={{ marginTop: '15px' }}>Description</label>
                        <input
                            id="description"
                            className="modal-input"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    </>
                )}

                <div className="modal-actions">
                    <button
                        type="button"
                        className="cancel-action cursor-pointer"
                        onClick={() => {
                            resetForm()
                            setIsOpen(false)
                        }}
                    >
                        Cancel
                    </button>
                    <button type="button" className="add-action cursor-pointer" onClick={handleSubmitDiscount}>{editPopup ? 'Save' : 'Add'}</button>
                </div>
            </div>
        </div>
        )}
        </>
    )
}