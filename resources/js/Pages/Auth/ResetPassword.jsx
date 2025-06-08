import ApplicationLogo from '@/Components/ApplicationLogo'
import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import PrimaryButton from '@/Components/PrimaryButton'
import TextInput from '@/Components/TextInput'
import GuestLayout from '@/Layouts/GuestLayout'
import { Head, useForm } from '@inertiajs/react'
import { useEffect } from 'react'

export default function ResetPassword({ token, email }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    token: token ?? '',
    email: email ?? '',
    password: '',
    password_confirmation: '',
  })

  useEffect(() => {
    return () => {
      reset('password', 'password_confirmation')
    }
  }, [])

  const submit = (e) => {
    e.preventDefault()
    post(route('password.store'))
  }

  return (
    <GuestLayout>
      <Head title="Restablecer contraseña" />
      <div className="max-w-xl w-full mx-auto p-8 bg-gray-900 rounded-md shadow-lg text-white mt-8 my-auto">
        <div className="flex justify-center mb-8">
          <ApplicationLogo className="h-12 w-auto text-gray-200" />
        </div>

        <div className="mb-6 text-sm text-gray-400 text-center">
          Introduce tu nueva contraseña para acceder de nuevo a tu cuenta.
        </div>

        <form onSubmit={submit}>
          <input type="hidden" name="token" value={data.token} />

          <div className="mb-4">
            <InputLabel htmlFor="email" value="Correo electrónico" className="text-gray-100 font-medium" />
            <TextInput
              id="email"
              type="email"
              name="email"
              value={data.email}
              className="mt-1 block w-full text-gray-200 bg-gray-800 border-gray-700 rounded-md shadow-sm"
              autoComplete="username"
              onChange={(e) => setData('email', e.target.value)}
              required
            />
            <InputError message={errors.email} className="mt-2 text-red-500" />
          </div>

          <div className="mb-4">
            <InputLabel htmlFor="password" value="Nueva contraseña" className="text-gray-100 font-medium" />
            <TextInput
              id="password"
              type="password"
              name="password"
              value={data.password}
              className="mt-1 block w-full text-gray-200 bg-gray-800 border-gray-700 rounded-md shadow-sm"
              autoComplete="new-password"
              onChange={(e) => setData('password', e.target.value)}
              required
            />
            <InputError message={errors.password} className="mt-2 text-red-500" />
          </div>

          <div className="mb-4">
            <InputLabel htmlFor="password_confirmation" value="Confirmar contraseña" className="text-gray-100 font-medium" />
            <TextInput
              id="password_confirmation"
              type="password"
              name="password_confirmation"
              value={data.password_confirmation}
              className="mt-1 block w-full text-gray-200 bg-gray-800 border-gray-700 rounded-md shadow-sm"
              autoComplete="new-password"
              onChange={(e) => setData('password_confirmation', e.target.value)}
              required
            />
            <InputError message={errors.password_confirmation} className="mt-2 text-red-500" />
          </div>

          <div className="flex items-center justify-end mt-6">
            <PrimaryButton className="ms-4 bg-blue-600 hover:bg-blue-700 text-white" disabled={processing}>
              Restablecer contraseña
            </PrimaryButton>
          </div>
        </form>
      </div>
    </GuestLayout>
  )
}
