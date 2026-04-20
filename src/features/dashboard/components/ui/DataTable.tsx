import React from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Edit, Eye} from "lucide-react";

//1. Definicion de columnas 

export interface ColumnDef<T> {
    header: string | React.ReactNode;
    // accessorKey es la clave del objeto que se va a mostrar en esa columna
    accessorKey?: keyof T;
    // Cell permite renderizar contenido personalizar (badges,avatares, fechas formateadas)
    cell?: (item: T) => React.ReactNode;
}

//2. Definicion de props del componente
interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    onEdit?: (item: T) => void;
    onView?: (item: T) => void;
    onDelete?: (item: T) => void;
    // Aqui se puede agregar mas props como loading, paginacion, ordenamiento, etc
    isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    onView,
    onEdit,
    onDelete,
    isLoading = false

}: DataTableProps<T>) {

    const hasActions = Boolean(onView || onEdit || onDelete);

    if (isLoading) {
        return <div className="p-4 text-center text-muted-foreground">Cargando datos...</div>;
    }
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col, index) => (
                            <TableHead key={index} className="h-14 px-6 text-sm">{col.header}</TableHead>
                        ))}
                        {hasActions && <TableHead className="h-14 px-6 text-sm text-right">Acciones</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length + (hasActions ? 1 : 0)} className="h-24 text-center">
                                No se encontraron resultados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                {columns.map((col, index) => (
                                    <TableCell key={index} className="px-6 py-4">
                                        {col.cell
                                            ? col.cell(item)
                                            : col.accessorKey
                                                ? (item[col.accessorKey] as React.ReactNode)
                                                : null}
                                    </TableCell>
                                ))}

                                {/**Columna de acciones */}
                                {hasActions && (
                                    <TableCell className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-8">
                                            {onView && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label="Ver ficha"
                                                    onClick={() => onView(item)}
                                                    className="h-11 w-11 rounded-full text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </Button>
                                            )}
                                            {onEdit && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label="Editar"
                                                    onClick={() => onEdit(item)}
                                                    className="h-11 w-11 rounded-full text-amber-500 hover:bg-amber-50 hover:text-amber-600"
                                                >
                                                    <Edit className="h-5 w-5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

        </div>
    );
}

