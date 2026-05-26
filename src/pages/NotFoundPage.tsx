import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="not-found-page">
      <div className="not-found-code">404</div>
      <p className="not-found-msg">{t('notFound.message')}</p>
      <button
        type="button"
        className="not-found-btn"
        onClick={() => navigate('/')}
      >
        {t('notFound.home')}
      </button>
    </div>
  )
}
