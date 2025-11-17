"use client";

import * as React from "react";
import { Check, ChevronsUpDown, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import type { Driver } from "./data";

interface DriverComboboxProps {
  drivers: Driver[];
}

export function DriverCombobox({ drivers }: DriverComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  return (
    <div className="grid gap-2">
      <Label htmlFor="driver_id" className="flex items-center gap-2">
        <User className="w-4 h-4 text-green-600" />
        Chofer
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value
              ? drivers.find((driver) => driver.user_id === value)
                  ?.nombre_completo
              : "Seleccionar chofer..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar chofer..." />
            <CommandList>
              <CommandEmpty>No se encontró el chofer.</CommandEmpty>
              <CommandGroup>
                {drivers.map((driver) => (
                  <CommandItem
                    key={driver.user_id}
                    value={driver.nombre_completo}
                    onSelect={() => {
                      setValue(driver.user_id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === driver.user_id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {driver.nombre_completo}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input type="hidden" name="driver_id" value={value} />
      {!value && (
        <p className="text-sm text-red-600 mt-1">
          Debes seleccionar un chofer
        </p>
      )}
    </div>
  );
}
