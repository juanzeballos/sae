import { useEffect, useState, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Cliente } from '@/types'
import type { ClienteRequest } from '@/services/clientes'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: ClienteRequest) => Promise<void>
  cliente?: Cliente | null  // null = modo crear, Cliente = modo editar
}

// ClienteFormModal: dialog reutilizable para crear y editar clientes.
// Recibe el cliente a editar (o null para crear) y llama a onSave con los datos del form.
function ClienteFormModal({ open, onClose, onSave, cliente }: Props) {
  const isEditing = cliente != null

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [saving, setSaving] = useState(false)

  // useEffect: cuando el modal se abre, carga los datos del cliente a editar.
  // El array de dependencias [cliente, open] hace que se ejecute cada vez que cambia.
  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre)
      setTelefono(cliente.telefono ?? '')
      setEmail(cliente.email ?? '')
      setDireccion(cliente.direccion ?? '')
    } else {
      // Modo crear: limpiar todos los campos
      setNombre('')
      setTelefono('')
      setEmail('')
      setDireccion('')
    }
  }, [cliente, open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        nombre,
        telefono: telefono || undefined,
        email: email || undefined,
        direccion: direccion || undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Nombre (full width) */}
            <div className="space-y-1 col-span-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                placeholder="Juan Pérez"
              />
            </div>
            {/* Teléfono */}
            <div className="space-y-1">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                placeholder="011 1234-5678"
              />
            </div>
            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="cliente@email.com"
              />
            </div>
            {/* Dirección (full width) */}
            <div className="space-y-1 col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                placeholder="Av. Corrientes 1234, CABA"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ClienteFormModal
