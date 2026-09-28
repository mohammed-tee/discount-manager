import './DeleteDiscount.css'
import '../../index.css'
import { X } from 'lucide-react'

export default function DeleteDiscount({ isDeleteModalOpen, setIsDeleteModalOpen, setDiscounts, discountToDelete }) {

    const togglePopup = () => {
        setIsDeleteModalOpen((prev) => !prev)
    }

    const handleDeleteDiscount = () => {
        setDiscounts((prev) => prev.filter((discount) => discount.id !== discountToDelete))
        setIsDeleteModalOpen(false)
    }

    return (
        <>
        {isDeleteModalOpen && (
        <div className="modal">
            <div className="overlay" onClick={togglePopup}></div>
            <div className="delete-content">
                <button className="close-button cursor-pointer" onClick={togglePopup}><X color="#767676" size={24}/></button>
                <h2 className="delete-title">Delete discount</h2>
                <h6 className="delete-description">Are you sure you want to delete this discount?</h6>
                <button type="button" className="delete-action cursor-pointer" onClick={handleDeleteDiscount}>Delete discount</button>
            </div>
        </div>
        )}
        </>
    )
}