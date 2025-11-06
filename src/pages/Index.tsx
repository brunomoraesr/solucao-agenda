import { useState } from "react";
import { Calendar, Clock, User, Mail, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type DaySchedule = {
  day: string;
  dayOfWeek: number;
  periods: ("morning" | "afternoon")[];
};

type TimeSlot = {
  time: string;
  available: boolean;
};

const availableSchedule: DaySchedule[] = [
  { day: "Segunda-feira", dayOfWeek: 1, periods: ["morning"] },
  { day: "Terça-feira", dayOfWeek: 2, periods: ["afternoon"] },
  { day: "Quarta-feira", dayOfWeek: 3, periods: ["morning"] },
  { day: "Quinta-feira", dayOfWeek: 4, periods: ["morning", "afternoon"] },
];

const generateTimeSlots = (period: "morning" | "afternoon"): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = period === "morning" ? 8 : 14;
  const startMinute = period === "morning" ? 30 : 30;
  const endHour = period === "morning" ? 12 : 18;

  let currentHour = startHour;
  let currentMinute = startMinute;

  while (currentHour < endHour || (currentHour === endHour && currentMinute === 0)) {
    const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
    slots.push({ time: timeString, available: true });

    currentMinute += 45;
    if (currentMinute >= 60) {
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    }
  }

  return slots;
};

const Index = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"morning" | "afternoon" | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const handleDaySelect = (day: DaySchedule) => {
    setSelectedDay(day);
    setSelectedPeriod(null);
    setSelectedTime(null);
    setStep(2);
  };

  const handlePeriodSelect = (period: "morning" | "afternoon") => {
    setSelectedPeriod(period);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    setShowConfirmation(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setShowConfirmation(false);
      setStep(1);
      setSelectedDay(null);
      setSelectedPeriod(null);
      setSelectedTime(null);
      setFormData({ name: "", email: "", phone: "" });
    }, 3000);
  };

  const periodLabel = selectedPeriod === "morning" ? "Manhã" : "Tarde";
  const timeSlots = selectedPeriod ? generateTimeSlots(selectedPeriod) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <div className="container mx-auto px-4 py-12">
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
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    step >= s
                      ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elegant scale-110"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
                      step > s ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 text-sm font-medium">
            <span className={step >= 1 ? "text-primary" : "text-muted-foreground"}>Dia</span>
            <span className={step >= 2 ? "text-primary" : "text-muted-foreground"}>Horário</span>
            <span className={step >= 3 ? "text-primary" : "text-muted-foreground"}>Dados</span>
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
                    <div className="flex gap-2 flex-wrap">
                      {day.periods.map((period) => (
                        <span
                          key={period}
                          className="px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent border border-accent/20"
                        >
                          {period === "morning" ? "Manhã" : "Tarde"}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Step 2: Time Selection */}
        {step === 2 && selectedDay && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
            <Card className="p-8 shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="mb-4 hover:bg-primary/10"
                >
                  ← Voltar
                </Button>
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  {selectedDay.day}
                </h2>
              </div>

              {/* Period Selection */}
              <div className="mb-6">
                <Label className="text-base mb-3 block">Período</Label>
                <div className="flex gap-3">
                  {selectedDay.periods.map((period) => (
                    <Button
                      key={period}
                      onClick={() => handlePeriodSelect(period)}
                      variant={selectedPeriod === period ? "default" : "outline"}
                      className={`flex-1 h-14 text-base transition-all duration-300 ${
                        selectedPeriod === period
                          ? "shadow-elegant scale-105"
                          : "hover:border-primary hover:bg-primary/5"
                      }`}
                    >
                      {period === "morning" ? "Manhã (08:30 - 12:00)" : "Tarde (14:30 - 18:00)"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              {selectedPeriod && (
                <div className="animate-in fade-in duration-500">
                  <Label className="text-base mb-3 block">Horário disponível</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        onClick={() => handleTimeSelect(slot.time)}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        disabled={!slot.available}
                        className={`h-14 text-base font-semibold transition-all duration-300 ${
                          selectedTime === slot.time
                            ? "shadow-elegant scale-105"
                            : "hover:border-accent hover:bg-accent/5"
                        }`}
                      >
                        {slot.time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Step 3: User Information */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom duration-500">
            <Card className="p-8 shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="mb-4 hover:bg-primary/10"
                >
                  ← Voltar
                </Button>
                <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                  <User className="w-6 h-6 text-primary" />
                  Seus dados
                </h2>
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <p className="text-sm font-medium text-accent">
                    {selectedDay?.day} • {periodLabel} • {selectedTime}
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
              <p className="text-sm">{selectedDay?.day}</p>
              <p className="text-sm">{periodLabel} • {selectedTime}</p>
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
