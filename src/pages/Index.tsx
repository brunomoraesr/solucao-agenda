import { useState, useEffect, Fragment } from "react";
import { Calendar, Clock, User, Mail, Phone, CheckCircle2, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type SessionType = "escalda-pes" | "pilates" | "massagem" | "acupuntura";

type Professional = "Cleane" | "Lia";

type DaySchedule = {
  day: string;
  dayOfWeek: number;
  periods: ("morning" | "afternoon")[];
  sessionTypes: SessionType[];
  pilatesOnlyAt11?: boolean;
};

type TimeSlot = {
  time: string;
  availableFor: Professional[];
};

type Booking = {
  day: string;
  period: "morning" | "afternoon";
  time: string;
  professional: Professional;
  sessionType: SessionType;
};

const availableSchedule: DaySchedule[] = [
  { day: "Segunda-feira", dayOfWeek: 1, periods: ["morning"], sessionTypes: ["escalda-pes"] },
  { day: "Terça-feira", dayOfWeek: 2, periods: ["morning", "afternoon"], sessionTypes: ["pilates", "massagem"], pilatesOnlyAt11: true },
  { day: "Quarta-feira", dayOfWeek: 3, periods: ["morning"], sessionTypes: ["massagem", "acupuntura"] },
  { day: "Quinta-feira", dayOfWeek: 4, periods: ["morning", "afternoon"], sessionTypes: ["escalda-pes", "pilates", "massagem"], pilatesOnlyAt11: true },
];

const sessionTypeLabels: Record<SessionType, string> = {
  "escalda-pes": "Escalda-Pés",
  "pilates": "Pilates",
  "massagem": "Massagem",
  "acupuntura": "Acupuntura",
};

const professionals: Professional[] = ["Cleane", "Lia"];

const generateTimeSlots = (
  period: "morning" | "afternoon",
  day: DaySchedule,
  sessionType: SessionType | null,
  bookings: Booking[]
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = period === "morning" ? 8 : 14;
  const startMinute = period === "morning" ? 30 : 30;
  const maxSlots = period === "morning" ? 4 : 4; // 4 slots de manhã, 8 à tarde

  let currentHour = startHour;
  let currentMinute = startMinute;
  let slotCount = 0;

  while (slotCount < maxSlots) {
    const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

    // Check if pilates is only at 11h
    if (sessionType === "pilates" && day.pilatesOnlyAt11 && timeString !== "11:00") {
      currentMinute += 45;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
      continue;
    }

    // Check which professionals are available for this slot
    const availableFor: Professional[] = professionals.filter((prof) => {
      return !bookings.some(
        (booking) =>
          booking.day === day.day &&
          booking.period === period &&
          booking.time === timeString &&
          booking.professional === prof
      );
    });

    slots.push({ time: timeString, availableFor });
    slotCount++;

    currentMinute += 45;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
};

const Index = () => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"morning" | "afternoon" | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const savedBookings = localStorage.getItem("bookings");
    if (savedBookings) {
      setBookings(JSON.parse(savedBookings));
    }
  }, []);

  const handleDaySelect = (day: DaySchedule) => {
    setSelectedDay(day);
    setSelectedSessionType(null);
    setSelectedProfessional(null);
    setSelectedPeriod(null);
    setSelectedTime(null);

    if (day.sessionTypes.length === 1) {
      setSelectedSessionType(day.sessionTypes[0]);
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleSessionTypeSelect = (sessionType: SessionType) => {
    setSelectedSessionType(sessionType);
    setSelectedProfessional(null);
    setSelectedPeriod(null);
    setSelectedTime(null);
    setStep(3);
  };

  const handleProfessionalSelect = (professional: Professional) => {
    setSelectedProfessional(professional);
    setSelectedPeriod(null);
    setSelectedTime(null);
    setStep(4);
  };

  const handlePeriodSelect = (period: "morning" | "afternoon") => {
    setSelectedPeriod(period);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(5);
  };

  const handleBack = () => {
    if (step === 5) {
      setStep(4);
    } else if (step === 4) {
      setStep(3);
    } else if (step === 3) {
      if (selectedDay && selectedDay.sessionTypes.length === 1) {
        setStep(1);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(1);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (!selectedDay || !selectedSessionType || !selectedProfessional || !selectedPeriod || !selectedTime) {
      toast.error("Por favor, complete todas as seleções");
      return;
    }

    const newBooking: Booking = {
      day: selectedDay.day,
      period: selectedPeriod,
      time: selectedTime,
      professional: selectedProfessional,
      sessionType: selectedSessionType,
    };

    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    localStorage.setItem("bookings", JSON.stringify(updatedBookings));

    setShowConfirmation(true);

    setTimeout(() => {
      setShowConfirmation(false);
      setStep(1);
      setSelectedDay(null);
      setSelectedSessionType(null);
      setSelectedProfessional(null);
      setSelectedPeriod(null);
      setSelectedTime(null);
      setFormData({ name: "", email: "", phone: "" });
    }, 3000);
  };

  const getAvailableSessionTypes = (): SessionType[] => {
    if (!selectedDay) return [];

    if (selectedDay.day === "Terça-feira") {
      return selectedDay.periods.map((p) =>
        p === "morning" ? "pilates" : "massagem"
      ) as SessionType[];
    }

    if (selectedDay.day === "Quinta-feira") {
      if (selectedDay.periods.includes("morning") && selectedDay.periods.includes("afternoon")) {
        return ["escalda-pes", "pilates", "massagem"] as SessionType[];
      }
    }

    return selectedDay.sessionTypes;
  };

  const getAvailablePeriodsForSession = (): ("morning" | "afternoon")[] => {
    if (!selectedDay || !selectedSessionType) return selectedDay?.periods || [];

    if (selectedDay.day === "Terça-feira") {
      return selectedSessionType === "pilates" ? (["morning"] as const) : (["afternoon"] as const);
    }

    if (selectedDay.day === "Quinta-feira") {
      if (selectedSessionType === "massagem") return ["afternoon"] as const;
      return ["morning"] as const;
    }

    return selectedDay.periods;
  };

  const periodLabel = selectedPeriod === "morning" ? "Manhã" : "Tarde";
  const timeSlots = selectedPeriod && selectedDay ? generateTimeSlots(selectedPeriod, selectedDay, selectedSessionType, bookings) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <div className="container mx-auto px-4 py-12 relative">

        {step > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="absolute top-8 left-4 md:top-12 md:left-8 w-12 h-12 z-10
                       bg-card/80 border border-border hover:bg-card shadow-md
                       transition-all duration-300 rounded-full"
            aria-label="Voltar à etapa anterior"
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </Button>
        )}

        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-elegant">
            <Calendar className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Agende sua Sessão
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o melhor horário para sua sessão de 45 minutos
          </p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-start justify-center px-2">
            {["Dia", "Sessão", "Profissional", "Horário", "Dados"].map((label, index) => {
              const s = index + 1;
              return (
                <Fragment key={s}>
                  <div className="flex flex-col items-center text-center" style={{ width: '4.5rem' }}>
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${step >= s
                          ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elegant scale-110"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {s}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${step >= s ? "text-primary" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </div>
                  {s < 5 && (
                    <div
                      className={`flex-1 h-1 rounded-full transition-all duration-300 mt-4 ${step > s ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"
                        }`}
                      style={{ minWidth: '2rem' }}
                    />
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* Step 1: Day Selection */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
            <Card className="p-8 shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                Selecione o dia da semana
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableSchedule.map((day) => (
                  <button
                    key={day.day}
                    onClick={() => handleDaySelect(day)}
                    className="p-6 rounded-xl border-2 border-border hover:border-primary bg-card hover:bg-primary/5 transition-all duration-300 text-left group hover:shadow-elegant hover:scale-105"
                  >
                    <div className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {day.day}
                    </div>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {day.periods.map((period) => (
                        <span
                          key={period}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {period === "morning" ? "Manhã" : "Tarde"}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {day.sessionTypes.map((type) => sessionTypeLabels[type]).join(", ")}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Step 2: Session Type Selection */}
        {step === 2 && selectedDay && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
            <Card className="p-8 shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="mb-4 hover:bg-primary/10"
                >
                  ← Voltar
                </Button>
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-primary" />
                  Tipo de Sessão
                </h2>
                <p className="text-muted-foreground mt-2">{selectedDay.day}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getAvailableSessionTypes().map((sessionType) => (
                  <Button
                    key={sessionType}
                    onClick={() => handleSessionTypeSelect(sessionType)}
                    variant="outline"
                    // === AJUSTE DE COR DO TEXTO NO HOVER ===
                    className="h-20 text-lg font-semibold hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300 hover:scale-105"
                  >
                    {sessionTypeLabels[sessionType]}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: Professional Selection */}
        {step === 3 && selectedDay && selectedSessionType && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
            <Card className="p-8 shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="mb-4 hover:bg-primary/10"
                >
                  ← Voltar
                </Button>
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Escolha a Profissional
                </h2>
                <p className="text-muted-foreground mt-2">
                  {selectedDay.day} • {sessionTypeLabels[selectedSessionType]}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {professionals.map((professional) => (
                  <Button
                    key={professional}
                    onClick={() => handleProfessionalSelect(professional)}
                    variant="outline"
                    // === AJUSTE DE COR DO TEXTO NO HOVER ===
                    className="h-24 text-xl font-semibold hover:border-accent hover:bg-accent/5 hover:text-primary transition-all duration-300 hover:scale-105"
                  >
                    {professional}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Step 4: Time Selection */}
        {step === 4 && selectedDay && selectedProfessional && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
            <Card className="p-8 shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="mb-4 hover:bg-primary/10"
                >
                  ← Voltar
                </Button>
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  Selecione o Horário
                </h2>
                <p className="text-muted-foreground mt-2">
                  {selectedDay.day} • {sessionTypeLabels[selectedSessionType!]} • {selectedProfessional}
                </p>
              </div>

              {/* Period Selection */}
              <div className="mb-6">
                <Label className="text-base mb-3 block">Período</Label>
                <div className="flex gap-3">
                  {getAvailablePeriodsForSession().map((period) => (
                    <Button
                      key={period}
                      onClick={() => handlePeriodSelect(period)}
                      variant={selectedPeriod === period ? "default" : "outline"}
                      className={`flex-1 h-14 text-base transition-all duration-300 ${selectedPeriod === period
                          ? "shadow-elegant scale-105"
                          // === AJUSTE DE COR DO TEXTO NO HOVER ===
                          : "hover:border-primary hover:bg-primary/5 hover:text-primary"
                        }`}
                    >
                      {period === "morning" ? "Manhã (08:30 - 12:00)" : "Tarde (14:30 - 17:30)"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              {selectedPeriod && (
                <div className="animate-in fade-in duration-500">
                  <Label className="text-base mb-3 block">
                    Horários disponíveis para {selectedProfessional}
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {timeSlots.map((slot) => {
                      const isAvailable = slot.availableFor.includes(selectedProfessional!);
                      return (
                        <Button
                          key={slot.time}
                          onClick={() => handleTimeSelect(slot.time)}
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          disabled={!isAvailable}
                          className={`h-14 text-base font-semibold transition-all duration-300 ${selectedTime === slot.time
                              ? "shadow-elegant scale-105"
                              : isAvailable
                                // === AJUSTE DE COR DO TEXTO NO HOVER (E BORDA) ===
                                ? "hover:border-primary hover:bg-primary/5 hover:text-primary"
                                : "opacity-50 cursor-not-allowed"
                            }`}
                        >
                          {slot.time}
                        </Button>
                      );
                    })}
                  </div>
                  {timeSlots.every((slot) => !slot.availableFor.includes(selectedProfessional!)) && (
                    <p className="text-center text-muted-foreground mt-4">
                      Nenhum horário disponível para esta profissional neste período.
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Step 5: User Information */}
        {step === 5 && (
          <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom duration-500">
            <Card className="p-8 shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="mb-4 hover:bg-primary/10"
                >
                  ← Voltar
                </Button>
                <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                  <User className="w-6 h-6 text-primary" />
                  Seus dados
                </h2>
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 space-y-1">
                  <p className="text-sm font-medium text-accent">
                    {selectedDay?.day} • {periodLabel} • {selectedTime}
                  </p>
                  <p className="text-sm font-medium text-accent">
                    {sessionTypeLabels[selectedSessionType!]} • {selectedProfessional}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-base">
                    Nome completo *
                  </Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-11 h-12 border-border focus:border-primary transition-colors"
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-base">
                    Email *
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-11 h-12 border-border focus:border-primary transition-colors"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-base">
                    Telefone *
                  </Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-11 h-12 border-border focus:border-primary transition-colors"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-semibold shadow-elegant hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-accent"
                >
                  Confirmar Agendamento
                </Button>
              </form>
            </Card>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md border-accent/20">
          <DialogHeader>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-4 animate-in zoom-in duration-500">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <DialogTitle className="text-2xl">Agendamento Confirmado!</DialogTitle>
            </div>
          </DialogHeader>
          <div className="text-center space-y-3 py-4">
            <p className="text-muted-foreground">
              Seu agendamento foi realizado com sucesso!
            </p>
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 space-y-1">
              <p className="font-semibold text-accent">{formData.name}</p>
              <p className="text-sm">{selectedDay?.day} • {periodLabel} • {selectedTime}</p>
              <p className="text-sm">{sessionTypeLabels[selectedSessionType!]} • {selectedProfessional}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Você receberá uma confirmação no email cadastrado.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;