import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function CreatePatientForm() {
  // Función que simula tu llamada a la API (reemplaza esto con tu fetch real)
  const savePatientToAPI = async (_data: any) => {
    // Ejemplo de llamada real:
    // const response = await api.createPatient(data);
    // if (!response.ok) throw new Error("Cédula duplicada");
    // return response.json();
    
    return new Promise((resolve, _reject) => {
      setTimeout(() => {
        // Simulamos que todo salió bien (cambia a reject para probar el error)
        resolve({ nombre: "Verónica", apellido: "Estrella" })
      }, 2500)
    })
  }

  const handleSavePatient = (patientData: any) => {
    // Pasamos la Promesa directamente a Sonner
    toast.promise(savePatientToAPI(patientData), {
      loading: 'Registrando paciente en el sistema...',
      success: (data: any) => {
        // Se ejecuta si la promesa se resuelve correctamente (resolve)
        // Puedes aprovechar para limpiar el formulario o redirigir aquí
        return `Yay! Everything worked! Paciente ${data.nombre} guardado. Esto es una prueba`
      },
      error: (_err) => {
        // Se ejecuta si la promesa falla (reject o throw Error)
        return `Uh oh, something went wrong. Inténtalo de nuevo.`
      },
    })
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">Nuevo Paciente</h2>
      {/* ... tus campos de formulario ... */}
      
      <Button 
        onClick={() => handleSavePatient({ nombre: "Prueba" })} 
        className="bg-[#1A5276] hover:bg-[#154360]"
      >
        Guardar Paciente
      </Button>
    </div>
  )
}