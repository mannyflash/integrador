import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'

export default function ProtectedLayout({ children, requiredUserType }: { children: React.ReactNode, requiredUserType: 'maestro' | 'laboratorista' | 'admin' }) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== requiredUserType) {
      toast.error(`Acceso no autorizado. Por favor, inicie sesión como ${requiredUserType}.`)
      router.push('/')
    }
  }, [isAuthenticated, user, router, requiredUserType])

  if (!isAuthenticated || user?.userType !== requiredUserType) {
    return null
  }

  return <>{children}</>
}

