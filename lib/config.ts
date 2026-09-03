import type { Broker } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/json";

export type OfficeHours = {
  days: number[];
  open: string;
  close: string;
};

export type EmergencyConfig = {
  generalEmergency?: string;
  police?: string;
  ambulance?: string;
  motorAssistance?: string;
  medicalAssistance?: string;
  notes?: string[];
};

export async function getPrimaryBroker() {
  const broker = await prisma.broker.findFirst({
    include: {
      user: true,
      insurers: true,
      communicationPreferences: true
    }
  });

  if (!broker) {
    throw new Error("No broker profile exists. Run pnpm db:seed first.");
  }

  return broker;
}

export function getOfficeHours(broker: Pick<Broker, "officeHoursJson">): OfficeHours {
  return parseJson<OfficeHours>(broker.officeHoursJson, {
    days: [1, 2, 3, 4, 5],
    open: "08:30",
    close: "17:00"
  });
}

export function getEmergencyConfig(broker: Pick<Broker, "emergencyConfigJson">): EmergencyConfig {
  return parseJson<EmergencyConfig>(broker.emergencyConfigJson, {});
}

export function isWithinOfficeHours(
  broker: Pick<Broker, "officeHoursJson" | "timezone">,
  at = new Date()
): boolean {
  const officeHours = getOfficeHours(broker);
  const timeZone = broker.timezone || "UTC";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(at);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Mon";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  if (!officeHours.days.includes(dayIndex)) return false;

  const nowMinutes = hour * 60 + minute;
  const openMinutes = toMinutes(officeHours.open);
  const closeMinutes = toMinutes(officeHours.close);
  return nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
}

export function officeHoursMessage(afterHours: boolean): string {
  if (!afterHours) {
    return "Your broker has been notified and will review your request.";
  }

  return "Your request has been safely recorded. Our office is currently closed, but your broker will see your submission when they next log in. If your situation is an emergency, please use the emergency assistance option.";
}

function toMinutes(value: string): number {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}
