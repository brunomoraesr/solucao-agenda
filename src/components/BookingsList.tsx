import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, Clock, User, Users } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format, parse, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";

type BookingData = {
  id: string;
  day: string;
  period: string;
  time: string;
  session_type: string;
  professional: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  created_at: string;
};

const sessionTypeLabels: Record<string, string> = {
  "escalda-pes": "Escalda-Pés",
  pilates: "Pilates",
  massagem: "Massagem",
  acupuntura: "Acupuntura",
};

const dayOfWeekMap: Record<string, number> = {
  "Segunda-feira": 1,
  "Terça-feira": 2,
  "Quarta-feira": 3,
  "Quinta-feira": 4,
  "Sexta-feira": 5,
  "Sábado": 6,
  "Domingo": 0,
};

export const BookingsList = () => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos");
      setLoading(false);
      return;
    }

    setBookings(data || []);
    setLoading(false);
  };

  // Função para encontrar a próxima data que corresponde ao dia da semana
  const getNextDateForDayOfWeek = (dayName: string, referenceDate: Date = new Date()): Date => {
    const targetDayOfWeek = dayOfWeekMap[dayName];
    const currentDayOfWeek = referenceDate.getDay();
    
    let daysToAdd = targetDayOfWeek - currentDayOfWeek;
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }
    
    const resultDate = new Date(referenceDate);
    resultDate.setDate(resultDate.getDate() + daysToAdd);
    return resultDate;
  };

  // Agrupar agendamentos por data
  const getBookingsForDate = (date: Date) => {
    return bookings.filter((booking) => {
      const bookingDate = getNextDateForDayOfWeek(booking.day, date);
      return isSameDay(bookingDate, date);
    });
  };

  // Obter todos os dias com agendamentos
  const getDatesWithBookings = () => {
    const dates: Date[] = [];
    const today = new Date();
    
    bookings.forEach((booking) => {
      const bookingDate = getNextDateForDayOfWeek(booking.day, today);
      if (!dates.some(d => isSameDay(d, bookingDate))) {
        dates.push(bookingDate);
      }
    });
    
    return dates;
  };

  const datesWithBookings = getDatesWithBookings();
  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendário */}
      <div className="lg:col-span-1">
        <Card className="p-4 border-border/50 backdrop-blur-sm bg-card/80">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            className="pointer-events-auto"
            modifiers={{
              booked: datesWithBookings,
            }}
            modifiersStyles={{
              booked: {
                fontWeight: 'bold',
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                color: 'hsl(var(--primary))',
              },
            }}
          />
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Dias com agendamentos</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de agendamentos do dia selecionado */}
      <div className="lg:col-span-1">
        <Card className="p-6 border-border/50 backdrop-blur-sm bg-card/80">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : selectedDateBookings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">
                Nenhum agendamento para este dia
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-xl border-2 border-border bg-background/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-lg font-semibold">{booking.time}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          {booking.period === "morning" ? "Manhã" : "Tarde"}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent border border-accent/20">
                        {sessionTypeLabels[booking.session_type] || booking.session_type}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{booking.user_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{booking.professional}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};