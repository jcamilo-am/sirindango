"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/dashboard/components/select";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

// Simulación de productos (en un caso real, esto vendría de una API o props)
const productos = [
  { id: 1, nombre: "Producto A" },
  { id: 2, nombre: "Producto B" },
  { id: 3, nombre: "Producto C" },
];

export default function VentaForm() {
  const [producto, setProducto] = useState("");
  const [cantidad, setCantidad] = useState(0);
  const [evento, setEvento] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    toast.success("¡Se guardó la venta con éxito!", {
      position: "bottom-right",
      autoClose: 2500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "dark",
    });
    setProducto("");
    setCantidad(0);
    setEvento("");
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-start mt-8">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 text-white rounded-xl shadow-lg p-8 flex flex-col gap-6 w-full max-w-xl"
      >
        <h2 className="text-3xl font-bold mb-2">REGISTRAR VENTAS</h2>
        <div>
          <label className="block mb-1 text-sm">Seleccionar producto</label>
          <Select value={producto} onValueChange={setProducto}>
            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
              <SelectValue placeholder="selecciona aquí" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 text-white">
              {productos.map((p) => (
                <SelectItem key={p.id} value={p.nombre} className="bg-zinc-800 text-white">
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block mb-1 text-sm">Ingresar cantidad</label>
          <Input
            type="number"
            min={0}
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">Evento</label>
          <Input
            type="text"
            value={evento}
            onChange={(e) => setEvento(e.target.value)}
            placeholder="Ingrese el nombre del evento"
            className="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 mt-2">Registrar</Button>
      </form>
      {/* Imagen del producto */}
      <div className="w-56 h-56 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 text-lg">
        imagen
      </div>
      {/* Modal de confirmación con AlertDialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-zinc-900 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desea guardar esta información?</AlertDialogTitle>
            <AlertDialogDescription>
              Se registrará la venta con los datos ingresados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Toastify container */}
      <ToastContainer />
    </div>
  );
}
