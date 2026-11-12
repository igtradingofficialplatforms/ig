
import React, { useEffect, useState } from 'react'
import './MyProfile.css'
import { SiBitcoin, SiEthereum } from 'react-icons/si'
import {
  FiUser,
  FiCamera,
  FiEdit3,
  FiSave,
  FiMapPin,
  FiPhone,
  FiMail,
  FiShield,
  FiX
} from 'react-icons/fi'

const emptyProfile = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  trc20_address: '',
  btc_address: '',
  eth_address: '',
  avatar_url: ''
}

export default function MyProfile({ session, supabase, onProfileUpdate }) {
  const [profile, setProfile] = useState(emptyProfile)
  const [originalProfile, setOriginalProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  const user = session?.user

  useEffect(() => {
    if (!photo) {
      setPhotoPreview('')
      return
    }

    const previewUrl = URL.createObjectURL(photo)
    setPhotoPreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [photo])

  useEffect(() => {
    if (!user?.id || !supabase) {
      setLoading(false)
      return
    }

    loadProfile()
  }, [user?.id, supabase])

  async function loadProfile() {
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error

      const loadedProfile = {
        ...emptyProfile,
        ...(data || {}),
        email: user.email || data?.email || ''
      }

      setProfile(loadedProfile)
      setOriginalProfile(loadedProfile)
    } catch (error) {
      setMessageType('error')
      setMessage(error.message || 'Unable to load profile.')
    } finally {
      setLoading(false)
    }
  }

  function updateField(field, value) {
    setProfile(previous => ({
      ...previous,
      [field]: value
    }))
  }

  function handlePhotoChange(event) {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      setMessageType('error')
      setMessage('Please select a JPG, PNG or WEBP image.')
      event.target.value = ''
      return
    }

    if (selectedFile.size > 3 * 1024 * 1024) {
      setMessageType('error')
      setMessage('Photo size must be under 3 MB.')
      event.target.value = ''
      return
    }

    setPhoto(selectedFile)
    setMessage('')
  }

  function cancelEditing() {
    setProfile(originalProfile)
    setPhoto(null)
    setEditing(false)
    setMessage('')
  }

  async function saveProfile() {
    if (!user?.id || !supabase) return

    if (!editing && !photo) return

    setSaving(true)
    setMessage('')

    try {
      let avatarUrl = profile.avatar_url

      if (photo) {
        const extension = photo.type === 'image/png'
          ? 'png'
          : photo.type === 'image/webp'
            ? 'webp'
            : 'jpg'

        const filePath = `${user.id}/avatar-${Date.now()}.${extension}`

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, photo, {
  upsert: false,
  contentType: photo.type
})

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath)

        avatarUrl = data.publicUrl
      }

      const savedData = {
        id: user.id,
        full_name: profile.full_name,
        email: user.email || profile.email,
        phone: profile.phone,
        address: profile.address,
        trc20_address: profile.trc20_address,
        btc_address: profile.btc_address,
        eth_address: profile.eth_address,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(savedData, { onConflict: 'id' })

      if (error) throw error

      const updatedProfile = {
        ...profile,
        avatar_url: avatarUrl,
        email: user.email || profile.email
      }

      setProfile(updatedProfile)
      setOriginalProfile(updatedProfile)
      setPhoto(null)
      setEditing(false)

      setMessageType('success')
      setMessage('Profile saved successfully.')

      if (onProfileUpdate) {
        onProfileUpdate(savedData)
      }
    } catch (error) {
      setMessageType('error')
      setMessage(error.message || 'Unable to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="mp-card">
        Please sign in to view your profile.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mp-card mp-loading">
        Loading your profile...
      </div>
    )
  }

  const avatarSource = photoPreview || profile.avatar_url

  return (
    <div className="my-profile">

      <div className="mp-header">
        <div>
          <span className="mp-eyebrow">ACCOUNT CENTER</span>
          <h2>My Profile</h2>
          <p>Manage your personal information</p>
        </div>

        <span className="mp-status">
          <FiShield />
          Account
        </span>
      </div>

      <section className="mp-card mp-avatar-card">
        <div className="mp-avatar">
          {avatarSource ? (
            <img src={avatarSource} alt="Profile" />
          ) : (
            <span>
              {profile.full_name?.charAt(0)?.toUpperCase() || <FiUser />}
            </span>
          )}
        </div>

        <div className="mp-avatar-info">
          <h3>{profile.full_name || 'Your Name'}</h3>
          <p>{user.email}</p>

          <label className="mp-upload">
            <FiCamera />
            Upload Photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePhotoChange}
            />
          </label>

          <small className="mp-photo-hint">
            JPG, PNG or WEBP · Maximum 3 MB
          </small>
        </div>
      </section>

      <section className="mp-card">
        <div className="mp-section-heading">
          <div>
            <h3>Personal Information</h3>
            <p className="mp-section-subtitle">
              Your basic account details
            </p>
          </div>

          <button
            type="button"
            className="mp-edit"
            onClick={() => editing ? cancelEditing() : setEditing(true)}
          >
            {editing ? <><FiX /> Cancel</> : <><FiEdit3 /> Edit</>}
          </button>
        </div>

        <div className="mp-grid">

          <label className="mp-field">
            <span><FiUser /> Full Name</span>
            <input
              value={profile.full_name || ''}
              placeholder="Enter your full name"
              disabled={!editing}
              onChange={e => updateField('full_name', e.target.value)}
            />
          </label>

          <label className="mp-field">
            <span><FiMail /> Email Address</span>
            <input
              value={profile.email || ''}
              placeholder="Account email"
              disabled
              readOnly
            />
          </label>

          <label className="mp-field">
            <span><FiPhone /> Phone Number</span>
            <input
              value={profile.phone || ''}
              placeholder="Enter phone number"
              disabled={!editing}
              onChange={e => updateField('phone', e.target.value)}
            />
          </label>

          <label className="mp-field">
            <span><FiMapPin /> Address</span>
            <input
              value={profile.address || ''}
              placeholder="Enter your address"
              disabled={!editing}
              onChange={e => updateField('address', e.target.value)}
            />
          </label>

        </div>
      </section>

      <section className="mp-card">
        <div className="mp-section-heading">
          <div>
            <h3>Saved Addresses</h3>
            <p className="mp-section-subtitle">
              Your saved account address details
            </p>
          </div>
        </div>

        <div className="mp-wallet-list">

          <label className="mp-wallet-field">
            <span className="mp-wallet-heading">
              <span className="mp-coin-icon mp-usdt-icon">
                ₮
              </span>
              <span className="mp-wallet-name">
                <strong>USDT</strong>
                <small>TRC20 Network</small>
              </span>
              <span className="mp-network-tag">TRC20</span>
            </span>

            <input
              value={profile.trc20_address || ''}
              placeholder="Enter saved USDT address"
              disabled={!editing}
              onChange={e => updateField('trc20_address', e.target.value)}
            />
          </label>

          <label className="mp-wallet-field">
            <span className="mp-wallet-heading">
              <span className="mp-coin-icon mp-btc-icon">
                <SiBitcoin />
              </span>
              <span className="mp-wallet-name">
                <strong>Bitcoin</strong>
                <small>BTC Network</small>
              </span>
              <span className="mp-network-tag">BTC</span>
            </span>

            <input
              value={profile.btc_address || ''}
              placeholder="Enter saved Bitcoin address"
              disabled={!editing}
              onChange={e => updateField('btc_address', e.target.value)}
            />
          </label>

          <label className="mp-wallet-field">
            <span className="mp-wallet-heading">
              <span className="mp-coin-icon mp-eth-icon">
                <SiEthereum />
              </span>
              <span className="mp-wallet-name">
                <strong>Ethereum</strong>
                <small>ETH Network</small>
              </span>
              <span className="mp-network-tag">ETH</span>
            </span>

            <input
              value={profile.eth_address || ''}
              placeholder="Enter saved Ethereum address"
              disabled={!editing}
              onChange={e => updateField('eth_address', e.target.value)}
            />
          </label>

        </div>

        <div className="mp-security-note">
          <FiShield />
          <p>
            Keep your account secure. Never save passwords, private keys,
            recovery phrases or OTP codes in these fields.
          </p>
        </div>
      </section>

      <div className="mp-footer">
        {message && (
          <p className={`mp-message ${messageType}`}>
            {message}
          </p>
        )}

        <button
          type="button"
          className="mp-save"
          onClick={saveProfile}
          disabled={saving || (!editing && !photo)}
        >
          {saving ? (
            'Saving...'
          ) : (
            <>
              <FiSave />
              Save Profile Information
            </>
          )}
        </button>
      </div>

    </div>
  )
}
