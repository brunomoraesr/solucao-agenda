import { useState, useEffect, Fragment } from "react";
import { Calendar as CalendarIcon, Clock, User, Mail, Phone, CheckCircle2, Users, ArrowLeft, Hash, CalendarCheck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { BookingsList } from "@/components/BookingsList";
import { format, getDay, isAfter, startOfDay, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type SessionType = "escalda-pes" | "pilates" | "massagem" | "acupuntura";
type Professional = "Cleane" | "Lia";

type DayConfig = {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  periods: ("morning" | "afternoon")[];
  sessionTypes: SessionType[];
  pilatesOnlyAt11?: boolean;
};

type TimeSlot = {
  time: string;
  availableFor: Professional[];
};

type Booking = {
  day: string; // formato: YYYY-MM-DD
  period: "morning" | "afternoon";
  time: string;
  professional: Professional;
  sessionType: SessionType;
};

// Configuração de quais dias da semana têm atendimento
const dayConfigs: DayConfig[] = [
  {
    dayOfWeek: 1, // Segunda-feira
    periods: ["morning"],
    sessionTypes: ["escalda-pes"],
  },
  {
    dayOfWeek: 2, // Terça-feira
    periods: ["morning", "afternoon"],
    sessionTypes: ["pilates", "massagem"],
    pilatesOnlyAt11: true,
  },
  {
    dayOfWeek: 3, // Quarta-feira
    periods: ["morning"],
    sessionTypes: ["massagem", "acupuntura"],
  },
  {
    dayOfWeek: 4, // Quinta-feira
    periods: ["morning", "afternoon"],
    sessionTypes: ["escalda-pes", "pilates", "massagem"],
    pilatesOnlyAt11: true,
  },
];

const sessionTypeLabels: Record<SessionType, string> = {
  "escalda-pes": "Escalda-Pés",
  pilates: "Pilates",
  massagem: "Massagem",
  acupuntura: "Acupuntura",
};

const dayOfWeekLabels: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

const professionals: Professional[] = ["Cleane", "Lia"];

const generateTimeSlots = (
  period: "morning" | "afternoon",
  dayConfig: DayConfig,
  sessionType: SessionType | null,
  bookings: Booking[],
  selectedDate: string
): TimeSlot[] => {
  if (sessionType === "pilates" && dayConfig.pilatesOnlyAt11) {
    const timeString = "11:00";
    if (period !== "morning") {
      return [];
    }
    const availableFor: Professional[] = professionals.filter((prof) => {
      return !bookings.some(
        (booking) =>
          booking.day === selectedDate &&
          booking.period === period &&
          booking.time === timeString &&
          booking.professional === prof
      );
    });
    return [{ time: timeString, availableFor }];
  }

  const slots: TimeSlot[] = [];
  const startHour = period === "morning" ? 8 : 14;
  const startMinute = period === "morning" ? 30 : 30;
  const maxSlots = 4;

  let currentHour = startHour;
  let currentMinute = startMinute;
  let slotCount = 0;

  while (slotCount < maxSlots) {
    const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
    const availableFor: Professional[] = professionals.filter((prof) => {
      return !bookings.some(
        (booking) =>
          booking.day === selectedDate &&
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
  const { user, signOut } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDayConfig, setSelectedDayConfig] = useState<DayConfig | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<SessionType | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"morning" | "afternoon" | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    ramal: "",
  });
  const [showBookings, setShowBookings] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  const fetchBookings = async () => {
    const { data, error } = await supabase.from("bookings").select("*");
    if (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
      return;
    }
    if (data) {
      const formattedBookings: Booking[] = data.map((booking) => ({
        day: booking.day,
        period: booking.period as "morning" | "afternoon",
        time: booking.time,
        professional: booking.professional as Professional,
        sessionType: booking.session_type as SessionType,
      }));
      setBookings(formattedBookings);
    }
  };

  // Função para verificar se uma data é válida para agendamento
  const isDateAvailable = (date: Date): boolean => {
    const dayOfWeek = getDay(date);
    const config = dayConfigs.find((c) => c.dayOfWeek === dayOfWeek);
    return !!config && isAfter(date, startOfDay(new Date()));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dayOfWeek = getDay(date);
    const config = dayConfigs.find((c) => c.dayOfWeek === dayOfWeek);
    
    if (!config) {
      toast.error("Este dia não possui atendimento disponível");
      return;
    }

    setSelectedDate(date);
    setSelectedDayConfig(config);
    setSelectedSessionType(null);
    setSelectedProfessional(null);
    setSelectedPeriod(null);
    setSelectedTime(null);
    setCalendarOpen(false);

    if (config.sessionTypes.length === 1) {
      setSelectedSessionType(config.sessionTypes[0]);
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
      if (selectedDayConfig && selectedDayConfig.sessionTypes.length === 1) {
        setStep(1);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Por favor, preencha todos os campos obrigatórios (*)");
      return;
    }
    if (!selectedDate || !selectedSessionType || !selectedProfessional || !selectedPeriod || !selectedTime) {
      toast.error("Por favor, complete todas as seleções");
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { error } = await supabase.from("bookings").insert({
      day: dateStr,
      period: selectedPeriod,
      time: selectedTime,
      professional: selectedProfessional,
      session_type: selectedSessionType,
      user_name: formData.name,
      user_email: formData.email,
      user_phone: formData.phone,
    });

    if (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error("Erro ao criar agendamento");
      return;
    }

    toast.success("Agendamento criado com sucesso!");
    await fetchBookings();
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
      setStep(1);
      setSelectedDate(undefined);
      setSelectedDayConfig(null);
      setSelectedSessionType(null);
      setSelectedProfessional(null);
      setSelectedPeriod(null);
      setSelectedTime(null);
      setFormData({
        name: "",
        email: user?.email || "",
        phone: "",
        ramal: "",
      });
    }, 3000);
  };

  const getAvailableSessionTypes = (): SessionType[] => {
    if (!selectedDayConfig) return [];
    const dayOfWeek = selectedDayConfig.dayOfWeek;

    if (dayOfWeek === 2) {
      // Terça
      return selectedDayConfig.periods.map((p) =>
        p === "morning" ? "pilates" : "massagem"
      ) as SessionType[];
    }
    if (dayOfWeek === 4) {
      // Quinta
      return ["escalda-pes", "pilates", "massagem"] as SessionType[];
    }
    return selectedDayConfig.sessionTypes;
  };

  const getAvailablePeriodsForSession = (): ("morning" | "afternoon")[] => {
    if (!selectedDayConfig || !selectedSessionType)
      return selectedDayConfig?.periods || [];
    const dayOfWeek = selectedDayConfig.dayOfWeek;

    if (dayOfWeek === 2) {
      // Terça
      return selectedSessionType === "pilates"
        ? (["morning"] as const)
        : (["afternoon"] as const);
    }
    if (dayOfWeek === 4) {
      // Quinta
      if (selectedSessionType === "massagem") return ["afternoon"] as const;
      return ["morning"] as const;
    }
    return selectedDayConfig.periods;
  };

  const periodLabel = selectedPeriod === "morning" ? "Manhã" : "Tarde";
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const timeSlots =
    selectedPeriod && selectedDayConfig
      ? generateTimeSlots(
          selectedPeriod,
          selectedDayConfig,
          selectedSessionType,
          bookings,
          selectedDateStr
        )
      : [];

  const formattedDate = selectedDate
    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "";
  const dayOfWeekName = selectedDate
    ? dayOfWeekLabels[getDay(selectedDate)]
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <div className="container mx-auto px-4 py-12 relative">
        {/* Header with Logout */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden md:block">
            {user?.email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

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
            <CalendarIcon className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Agende sua Sessão
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o melhor horário para sua sessão de 45 minutos
          </p>
          <div className="mt-6">
            <Button
              onClick={() => setShowBookings(!showBookings)}
              variant="outline"
              className="gap-2"
            >
              <CalendarCheck className="w-5 h-5" />
              {showBookings ? "Voltar ao Agendamento" : "Ver Agendamentos"}
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        {!showBookings && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-start justify-center px-2">
              {["Data", "Sessão", "Profissional", "Horário", "Dados"].map(
                (label, index) => {
                  const s = index + 1;
                  return (
                    <Fragment key={s}>
                      <div
                        className="flex flex-col items-center text-center"
                        style={{ width: "4.5rem" }}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                            step >= s
                              ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-elegant scale-110"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {s}
                        </div>
                        <span
                          className={`mt-2 text-xs font-medium ${
                            step >= s ? "text-primary" : "text-muted-foreground"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      {s < 5 && (
                        <div
                          className={`flex-1 h-1 rounded-full transition-all duration-300 mt-4 ${
                            step > s
                              ? "bg-gradient-to-r from-primary to-accent"
                              : "bg-muted"
                          }`}
                          style={{ minWidth: "2rem" }}
                        />
                      )}
                    </Fragment>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Bookings List Section */}
        {showBookings && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
            <Card className="p-8 shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-primary" />
                Agendamentos
              </h2>
              <BookingsList />
            </Card>
          </div>
        )}

        {/* Step 1: Date Selection */}
        {!showBookings && step === 1 && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
            <Card className="p-8 shadow-soft border-border/50 backdrop-blur-sm bg-card/80">
              <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-primary" />
                Selecione a data
              </h2>
              <p className="text-muted-foreground mb-6">
                Atendimentos disponíveis: Segunda, Terça, Quarta e Quinta-feira
              </p>

              <div className="flex justify-center">
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full max-w-sm h-14 justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      {selectedDate ? (
                        format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Clique para selecionar uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      locale={ptBR}
                      disabled={(date) => !isDateAvailable(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {dayConfigs.map((config) => (
                  <div
                    key={config.dayOfWeek}
                    className="p-4 rounded-xl border border-border bg-card/50"
                  >
                    <div className="font-semibold text-primary mb-2">
                      {dayOfWeekLabels[config.dayOfWeek]}
                    </div>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {config.periods.map((period) => (
                        <span
                          key={period}
                          className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {period === "morning" ? "Manhã" : "Tarde"}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {config.sessionTypes
                        .map((type) => sessionTypeLabels[type])
                        .join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Step 2: Session Type Selection */}
        {!showBookings && step === 2 && selectedDayConfig && (
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
                  <CalendarIcon className="w-6 h-6 text-primary" />
                  Tipo de Sessão
                </h2>
                <p className="text-muted-foreground mt-2">
                  {dayOfWeekName}, {formattedDate}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getAvailableSessionTypes().map((sessionType) => (
                  <Button
                    key={sessionType}
                    onClick={() => handleSessionTypeSelect(sessionType)}
                    variant="outline"
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
        {!showBookings && step === 3 && selectedDayConfig && selectedSessionType && (
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
                  {dayOfWeekName}, {formattedDate} •{" "}
                  {sessionTypeLabels[selectedSessionType]}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {professionals.map((professional) => (
                  <Button
                    key={professional}
                    onClick={() => handleProfessionalSelect(professional)}
                    variant="outline"
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
        {step === 4 && selectedDayConfig && selectedProfessional && (
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
                  {dayOfWeekName}, {formattedDate} •{" "}
                  {sessionTypeLabels[selectedSessionType!]} • {selectedProfessional}
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
                      className={`flex-1 h-14 text-base transition-all duration-300 ${
                        selectedPeriod === period
                          ? "shadow-elegant scale-105"
                          : "hover:border-primary hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      {period === "morning"
                        ? "Manhã (08:30 - 12:00)"
                        : "Tarde (14:30 - 17:30)"}
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
                      const isAvailable = slot.availableFor.includes(
                        selectedProfessional!
                      );
                      return (
                        <Button
                          key={slot.time}
                          onClick={() => handleTimeSelect(slot.time)}
                          variant={
                            selectedTime === slot.time ? "default" : "outline"
                          }
                          disabled={!isAvailable}
                          className={`h-14 text-base font-semibold transition-all duration-300 ${
                            selectedTime === slot.time
                              ? "shadow-elegant scale-105"
                              : isAvailable
                              ? "hover:border-primary hover:bg-primary/5 hover:text-primary"
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          {slot.time}
                        </Button>
                      );
                    })}
                  </div>
                  {timeSlots.every(
                    (slot) => !slot.availableFor.includes(selectedProfessional!)
                  ) && (
                    <p className="text-center text-muted-foreground mt-4">
                      Nenhum horário disponível para esta profissional neste
                      período.
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Step 5: User Information */}
        {!showBookings && step === 5 && (
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
                    {dayOfWeekName}, {formattedDate} • {periodLabel} •{" "}
                    {selectedTime}
                  </p>
                  <p className="text-sm font-medium text-accent">
                    {sessionTypeLabels[selectedSessionType!]} •{" "}
                    {selectedProfessional}
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
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="pl-11 h-12 border-border focus:border-primary transition-colors"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ramal" className="text-base">
                    Ramal
                  </Label>
                  <div className="relative mt-2">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="ramal"
                      type="tel"
                      value={formData.ramal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ramal: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="pl-11 h-12 border-border focus:border-primary transition-colors"
                      placeholder="0000"
                      maxLength={4}
                      pattern="[0-9]{4}"
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
              <DialogTitle className="text-2xl">
                Agendamento Confirmado!
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="text-center space-y-3 py-4">
            <p className="text-muted-foreground">
              Seu agendamento foi realizado com sucesso!
            </p>
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 space-y-1">
              <p className="font-semibold text-accent">{formData.name}</p>
              <p className="text-sm">
                {dayOfWeekName}, {formattedDate} • {periodLabel} • {selectedTime}
              </p>
              <p className="text-sm">
                {sessionTypeLabels[selectedSessionType!]} •{" "}
                {selectedProfessional}
              </p>
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
