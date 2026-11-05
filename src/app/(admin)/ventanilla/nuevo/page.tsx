"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { CURRENT_USER } from "@/components/providers/ventanilla-provider";
import { RadicarForm } from "@/components/radicar/radicar-form";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CHANNEL_LABELS } from "@/lib/ventanilla/types";
import type { Channel } from "@/lib/ventanilla/types";

/** A3/A4: radicación presencial o telefónica hecha por la coordinación en nombre del ciudadano. */
export default function NuevoRadicadoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [channel, setChannel] = React.useState<Channel>("presencial");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Radicar en nombre de"
        description="Para documentos entregados en físico o peticiones verbales. Queda registrado quién radicó."
      />
      <Card className="rounded-2xl">
        <CardContent className="space-y-6 p-5 sm:p-8">
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="channel">Canal de recepción</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
              <SelectTrigger id="channel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["presencial", "whatsapp"] as const).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CHANNEL_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <RadicarForm
            channel={channel}
            onBehalfOf={CURRENT_USER.name}
            onDone={(r) => {
              toast({ title: `Radicado ${r.number}`, description: "Acuse enviado al radicante." });
              router.push(`/ventanilla/${r.id}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
