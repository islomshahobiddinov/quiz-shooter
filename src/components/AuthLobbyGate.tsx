import { useTranslation } from 'react-i18next'

type Props = {
  onSignIn: () => void
}

export function AuthLobbyGate({ onSignIn }: Props) {
  const { t } = useTranslation()
  return (
    <div className="auth-lobby-gate">
      <p className="auth-lobby-gate__text">{t('authGate.message')}</p>
      <button type="button" className="auth-button auth-lobby-gate__btn" onClick={onSignIn}>
        {t('nav.signIn')}
      </button>
    </div>
  )
}
