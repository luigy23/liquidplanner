import { useState, useEffect } from 'react';
import {
    AlertCircle, Clock, CheckCircle, Coffee, Moon, Sun,
    Briefcase, Zap, Dumbbell, Heart, ArrowDown, Trash2, Sunrise, Calendar,
    ArrowUp, Eye, EyeOff, Save
} from 'lucide-react';

// --- TIPOS DE DATOS ---
type BlockType = 'symmetry' | 'skillion' | 'gym' | 'social' | 'bio' | 'fixed' | 'unexpected';

interface Block {
    id: string;
    title: string;
    duration: number; // en minutos
    type: BlockType;
    completed: boolean;
    fixedTime?: string;
    isFlexible?: boolean;
}

// --- PLANTILLAS ---
const GYM_DAY_TEMPLATE: Block[] = [
    { id: '1', title: 'Rutina Mañana & Desayuno', duration: 30, type: 'bio', completed: false },
    { id: '2', title: 'Symmetry Sprint #1 (Deep Work)', duration: 120, type: 'symmetry', completed: false },
    { id: '3', title: 'Recarga (Siesta/Ojos cerrados)', duration: 20, type: 'bio', completed: false },
    { id: '4', title: 'Symmetry Sprint #2', duration: 120, type: 'symmetry', completed: false },
    { id: '5', title: 'Daily Meeting (Fija)', duration: 45, type: 'fixed', fixedTime: '12:30', completed: false },
    { id: '6', title: 'Almuerzo', duration: 30, type: 'bio', completed: false },
    { id: '7', title: 'Digestión Activa (Admin/Lectura)', duration: 60, type: 'bio', completed: false },
    { id: '8', title: 'Gym (Fullbody)', duration: 120, type: 'gym', completed: false },
    { id: '9', title: 'Skillion (Gestión/Ligero)', duration: 30, type: 'skillion', completed: false },
    { id: '10', title: 'Ducha & Salida', duration: 15, type: 'bio', completed: false },
    { id: '11', title: 'Novia / Social / Cena', duration: 180, type: 'social', completed: false },
];

const SKILLION_DAY_TEMPLATE: Block[] = [
    { id: '1', title: 'Rutina Mañana & Desayuno', duration: 30, type: 'bio', completed: false },
    { id: '2', title: 'Symmetry Sprint #1 (Deep Work)', duration: 120, type: 'symmetry', completed: false },
    { id: '3', title: 'Recarga (Siesta/Ojos cerrados)', duration: 20, type: 'bio', completed: false },
    { id: '4', title: 'Symmetry Sprint #2', duration: 120, type: 'symmetry', completed: false },
    { id: '5', title: 'Daily Meeting (Fija)', duration: 45, type: 'fixed', fixedTime: '12:30', completed: false },
    { id: '6', title: 'Almuerzo', duration: 45, type: 'bio', completed: false },
    { id: '7', title: 'Skillion Deep Work (Prog/Reels)', duration: 150, type: 'skillion', completed: false },
    { id: '8', title: 'Ducha & Salida', duration: 30, type: 'bio', completed: false },
    { id: '9', title: 'Novia / Social / Cena', duration: 180, type: 'social', completed: false },
];

const STORAGE_KEY = 'liquid-planner-v2-data';

const LiquidPlanner = () => {
    // --- ESTADOS ---
    const [schedule, setSchedule] = useState<Block[]>(GYM_DAY_TEMPLATE);
    const [tomorrowSchedule, setTomorrowSchedule] = useState<Block[]>(SKILLION_DAY_TEMPLATE);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [startTime, setStartTime] = useState<Date>(new Date());
    const [showEmergencyInput, setShowEmergencyInput] = useState(false);
    const [emergencyDuration, setEmergencyDuration] = useState(30);

    const [isSleeping, setIsSleeping] = useState(false);
    const [viewMode, setViewMode] = useState<'today' | 'tomorrow'>('today'); // Nuevo estado para alternar vistas
    const [nextDayMode, setNextDayMode] = useState<'gym' | 'skillion'>('gym');

    // --- PERSISTENCIA & INICIALIZACIÓN ---

    // Cargar datos al iniciar
    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setSchedule(parsed.schedule || GYM_DAY_TEMPLATE);
                setTomorrowSchedule(parsed.tomorrowSchedule || SKILLION_DAY_TEMPLATE);
                setIsSleeping(parsed.isSleeping || false);

                // Recuperar fechas (localStorage las guarda como strings)
                if (parsed.startTime) setStartTime(new Date(parsed.startTime));

            } catch (e) {
                console.error("Error cargando datos", e);
            }
        } else {
            // Configuración inicial por defecto
            const idealStart = new Date();
            idealStart.setHours(7, 30, 0, 0);
            setStartTime(idealStart);
        }
    }, []);

    // Guardar datos cada vez que cambian
    useEffect(() => {
        const dataToSave = {
            schedule,
            tomorrowSchedule,
            isSleeping,
            startTime: startTime.toISOString(),
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }, [schedule, tomorrowSchedule, isSleeping, startTime]);

    // Reloj
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);


    // --- LÓGICA DE CÁLCULO (Solo afecta a la vista de Hoy) ---
    const calculateSchedule = (blocks: Block[], baseStartTime: Date) => {
        let cursorTime = new Date(baseStartTime);

        return blocks.map((block) => {
            const blockStart = new Date(cursorTime);
            let blockEnd = new Date(cursorTime.getTime() + block.duration * 60000);

            let status = 'normal';
            let conflictMsg = '';

            if (block.fixedTime) {
                const [hours, minutes] = block.fixedTime.split(':').map(Number);
                const fixedDate = new Date(cursorTime);
                fixedDate.setHours(hours, minutes, 0, 0);

                // Si cambiamos de día en la previsión (ej. mañana), ajustamos la fecha base
                if (baseStartTime.getDate() !== fixedDate.getDate()) {
                    fixedDate.setDate(baseStartTime.getDate());
                }

                if (blockStart > fixedDate) {
                    status = 'late';
                    const diff = Math.round((blockStart.getTime() - fixedDate.getTime()) / 60000);
                    conflictMsg = `Vas ${diff} min tarde`;
                } else if (blockStart < fixedDate) {
                    status = 'wait';
                    const waitTime = Math.round((fixedDate.getTime() - blockStart.getTime()) / 60000);
                    if (waitTime > 10) conflictMsg = `${waitTime} min libres antes`;
                    cursorTime = fixedDate;
                    blockEnd = new Date(fixedDate.getTime() + block.duration * 60000);
                }
            }
            cursorTime = blockEnd;
            return { ...block, calculatedStart: blockStart, calculatedEnd: blockEnd, status, conflictMsg };
        });
    };

    // Calculamos los bloques visuales dependiendo de la vista
    const activeBlocks = viewMode === 'today' ? schedule : tomorrowSchedule;

    // Para "Mañana", simulamos que empieza a las 7:30 AM del día siguiente
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    tomorrowDate.setHours(7, 30, 0, 0);

    const calculationBaseTime = viewMode === 'today' ? startTime : tomorrowDate;
    const calculatedBlocks = calculateSchedule(activeBlocks, calculationBaseTime);

    // --- ACCIONES DE BLOQUES ---

    const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= activeBlocks.length) return;

        const newSchedule = [...activeBlocks];
        const [movedBlock] = newSchedule.splice(index, 1);
        newSchedule.splice(newIndex, 0, movedBlock);

        if (viewMode === 'today') setSchedule(newSchedule);
        else setTomorrowSchedule(newSchedule);
    };

    const toggleComplete = (id: string) => {
        if (viewMode === 'tomorrow') return; // No completamos tareas del futuro
        setSchedule(schedule.map(b => b.id === id ? { ...b, completed: !b.completed } : b));
    };

    const deleteBlock = (id: string) => {
        const newBlocks = activeBlocks.filter(b => b.id !== id);
        if (viewMode === 'today') setSchedule(newBlocks);
        else setTomorrowSchedule(newBlocks);
    };

    const handleWokeUpLate = () => {
        setStartTime(new Date());
    };

    const handleEmergency = () => {
        const newBlock: Block = {
            id: Date.now().toString(),
            title: '⚠️ Imprevisto / Urgencia',
            duration: emergencyDuration,
            type: 'unexpected',
            completed: false
        };

        // Insertar después del primer bloque no completado
        const firstIncompleteIdx = schedule.findIndex(b => !b.completed);
        const idx = firstIncompleteIdx === -1 ? schedule.length : firstIncompleteIdx;

        const newSchedule = [...schedule];
        newSchedule.splice(idx, 0, newBlock);
        setSchedule(newSchedule);
        setShowEmergencyInput(false);
    };

    // --- CICLO DE DÍA ---

    const endDay = () => {
        setIsSleeping(true);
        setViewMode('today'); // Reseteamos vista al dormir
    };

    const startNewDay = () => {
        // El "Mañana" se convierte en "Hoy"
        // Generamos nuevos IDs para evitar conflictos de React keys
        const newToday = tomorrowSchedule.map((b, i) => ({ ...b, id: `today-${Date.now()}-${i}`, completed: false }));

        // Preparamos el "Nuevo Mañana" (Alternamos template por defecto)
        const nextTemplate = nextDayMode === 'gym' ? SKILLION_DAY_TEMPLATE : GYM_DAY_TEMPLATE;
        // Nota: Lógica simple de alternancia. Si hoy fue Gym (usamos tomorrow template), mañana sugerimos Skillion.
        // O mejor, reseteamos el 'tomorrow' a una plantilla base y dejamos que el usuario elija.
        const newTomorrow = nextTemplate.map((b, i) => ({ ...b, id: `tmrw-${Date.now()}-${i}`, completed: false }));

        setSchedule(newToday);
        setTomorrowSchedule(newTomorrow);

        const newStart = new Date();
        newStart.setHours(7, 30, 0, 0);
        setStartTime(newStart);

        setIsSleeping(false);
    };

    // Helpers para cargar plantilla en vista Mañana
    const loadTemplateToTomorrow = (type: 'gym' | 'skillion') => {
        const template = type === 'gym' ? GYM_DAY_TEMPLATE : SKILLION_DAY_TEMPLATE;
        const freshTemplate = template.map((b, i) => ({ ...b, id: `tmrw-load-${Date.now()}-${i}`, completed: false }));
        setTomorrowSchedule(freshTemplate);
    };

    // --- UI HELPERS ---
    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const getIcon = (type: BlockType) => {
        switch (type) {
            case 'symmetry': return <Briefcase size={18} className="text-red-400" />;
            case 'skillion': return <Zap size={18} className="text-purple-400" />;
            case 'gym': return <Dumbbell size={18} className="text-green-400" />;
            case 'social': return <Heart size={18} className="text-pink-400" />;
            case 'bio': return <Coffee size={18} className="text-yellow-600" />;
            case 'fixed': return <Clock size={18} className="text-blue-400" />;
            case 'unexpected': return <AlertCircle size={18} className="text-orange-500" />;
            default: return <Sun size={18} />;
        }
    };

    const getColorClass = (type: BlockType, completed: boolean) => {
        if (completed) return 'bg-gray-800 border-gray-700 opacity-50';
        // Colores base más transparentes para modo preview (mañana)
        // const opacity = viewMode === 'tomorrow' ? '40' : '100';


        switch (type) {
            case 'symmetry': return `bg-red-900/10 border-red-500/30 hover:bg-red-900/20`;
            case 'skillion': return `bg-purple-900/10 border-purple-500/30 hover:bg-purple-900/20`;
            case 'gym': return `bg-green-900/10 border-green-500/30 hover:bg-green-900/20`;
            case 'social': return `bg-pink-900/10 border-pink-500/30 hover:bg-pink-900/20`;
            case 'bio': return `bg-yellow-900/5 border-yellow-600/20 hover:bg-yellow-900/10`;
            case 'fixed': return `bg-blue-900/10 border-blue-500/30`;
            case 'unexpected': return `bg-orange-900/20 border-orange-500 border-dashed`;
            default: return `bg-gray-800 border-gray-700`;
        }
    };

    // --- PANTALLA DE DORMIR ---
    if (isSleeping) {
        return (
            <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
                <Moon size={64} className="text-blue-400 mb-6 animate-pulse" />
                <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    Modo Descanso
                </h1>
                <p className="text-gray-400 max-w-md mb-10 text-lg">
                    Desconecta tu cerebro. Mañana será otro día para construir.
                </p>

                <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-sm shadow-2xl">
                    <h3 className="text-xl font-semibold mb-6 flex items-center justify-center gap-2">
                        <Sunrise className="text-yellow-400" /> Iniciar Nuevo Día
                    </h3>

                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => { setNextDayMode('gym'); startNewDay(); }} // Simplificado para acción directa
                            className={`flex-1 py-4 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-2 border-gray-700 text-gray-400 hover:border-green-500 hover:text-green-400`}
                        >
                            <Dumbbell size={24} />
                            <span className="font-medium">Es Día Gym</span>
                        </button>
                        <button
                            onClick={() => { setNextDayMode('skillion'); startNewDay(); }}
                            className={`flex-1 py-4 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-2 border-gray-700 text-gray-400 hover:border-purple-500 hover:text-purple-400`}
                        >
                            <Zap size={24} />
                            <span className="font-medium">Es Día Skillion</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                        Esto moverá lo que planificaste en "Mañana" a "Hoy".
                    </p>
                </div>
            </div>
        );
    }

    // --- VISTA PRINCIPAL ---
    const endOfDay = calculatedBlocks[calculatedBlocks.length - 1]?.calculatedEnd;
    const isDayOverrun = endOfDay && (endOfDay.getHours() >= 23 && endOfDay.getMinutes() > 30 || endOfDay.getHours() < 4);

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 md:p-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* --- PANEL IZQUIERDO --- */}
                <div className="md:col-span-4 lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm sticky top-6">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-1">
                            Liquid Planner
                        </h1>
                        <p className="text-xs text-gray-400 mb-6 flex items-center gap-2">
                            <Save size={12} /> Guardado automático activo
                        </p>

                        {/* Reloj */}
                        <div className="flex items-end justify-between mb-8 border-b border-gray-800 pb-6">
                            <div>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Hora Actual</span>
                                <div className="text-4xl font-mono font-bold text-white tracking-tight">
                                    {formatTime(currentTime)}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Fin {viewMode === 'tomorrow' ? 'Previsto' : 'Estimado'}</span>
                                <div className={`text-2xl font-mono font-bold ${isDayOverrun ? 'text-red-400' : 'text-gray-300'}`}>
                                    {endOfDay ? formatTime(endOfDay) : '--:--'}
                                </div>
                            </div>
                        </div>

                        {/* Controles Principales */}
                        {viewMode === 'today' ? (
                            <div className="space-y-3 animate-in fade-in">
                                <button
                                    onClick={handleWokeUpLate}
                                    className="w-full flex items-center justify-start gap-3 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl border border-gray-700 transition-all group"
                                >
                                    <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 group-hover:bg-yellow-500/20">
                                        <Sun size={20} />
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-medium text-sm">Resetear Inicio</span>
                                        <span className="block text-xs text-gray-400">¡Me desperté ahora mismo!</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setShowEmergencyInput(!showEmergencyInput)}
                                    className="w-full flex items-center justify-start gap-3 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-xl border border-gray-700 transition-all group"
                                >
                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500 group-hover:bg-orange-500/20">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-medium text-sm">Imprevisto</span>
                                        <span className="block text-xs text-gray-400">Insertar urgencia en el plan</span>
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 mb-4 animate-in fade-in">
                                <h3 className="text-blue-200 font-bold flex items-center gap-2 mb-2">
                                    <Calendar size={18} /> Planificando Mañana
                                </h3>
                                <p className="text-sm text-blue-200/70 mb-4">
                                    Elige una plantilla base para comenzar a editar el día siguiente.
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => loadTemplateToTomorrow('gym')} className="py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-600">Base Gym</button>
                                    <button onClick={() => loadTemplateToTomorrow('skillion')} className="py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-600">Base Skillion</button>
                                </div>
                            </div>
                        )}

                        {/* Input de Emergencia */}
                        {showEmergencyInput && viewMode === 'today' && (
                            <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-orange-500/30 animate-in slide-in-from-top-2">
                                <label className="block text-xs uppercase text-gray-400 mb-2 font-semibold">Duración del Caos</label>
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    {[15, 30, 45, 60].map(mins => (
                                        <button
                                            key={mins}
                                            onClick={() => setEmergencyDuration(mins)}
                                            className={`py-2 rounded-lg text-xs font-bold transition-colors ${emergencyDuration === mins ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                                        >
                                            {mins}m
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleEmergency}
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 rounded-lg font-medium text-sm transition-colors"
                                >
                                    Insertar y Empujar Horario
                                </button>
                            </div>
                        )}

                        {/* Footer Panel */}
                        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col gap-3">
                            <button
                                onClick={endDay}
                                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800 py-3 rounded-xl transition-all"
                            >
                                <Moon size={18} />
                                <span>Finalizar Día e Ir a Dormir</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- PANEL DERECHO: TIMELINE --- */}
                <div className="md:col-span-8 lg:col-span-8">

                    {/* Tabs de Vista */}
                    <div className="flex items-center gap-4 mb-6 bg-gray-900/50 p-1 rounded-xl w-fit border border-gray-800">
                        <button
                            onClick={() => setViewMode('today')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'today' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Sun size={16} /> Hoy
                        </button>
                        <button
                            onClick={() => setViewMode('tomorrow')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'tomorrow' ? 'bg-blue-900/40 text-blue-200 border border-blue-500/30 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {viewMode === 'tomorrow' ? <Eye size={16} /> : <EyeOff size={16} />}
                            Mañana
                        </button>
                    </div>

                    <div className={`bg-gray-900/30 rounded-3xl p-1 min-h-[500px] ${viewMode === 'tomorrow' ? 'border-2 border-dashed border-blue-900/30' : ''}`}>
                        <div className="space-y-4">
                            {calculatedBlocks.length === 0 && viewMode === 'tomorrow' && (
                                <div className="text-center p-10 text-gray-500">
                                    Carga una plantilla en el panel izquierdo para empezar a planear mañana.
                                </div>
                            )}

                            {calculatedBlocks.map((block, idx) => (
                                <div
                                    key={block.id}
                                    className={`relative group flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${getColorClass(block.type, block.completed)}`}
                                >
                                    {/* Conector Visual Timeline */}
                                    {idx < calculatedBlocks.length - 1 && (
                                        <div className="hidden md:block absolute left-[29px] top-[60px] bottom-[-20px] w-0.5 bg-gray-800 -z-10"></div>
                                    )}

                                    {/* Icono y Checkbox */}
                                    <div className="flex items-center gap-4 shrink-0">
                                        <button
                                            onClick={() => toggleComplete(block.id)}
                                            disabled={viewMode === 'tomorrow'}
                                            className={`p-2 rounded-full transition-colors ${block.completed ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-300'} ${viewMode === 'tomorrow' ? 'cursor-not-allowed opacity-50' : ''}`}
                                        >
                                            {block.completed ? <CheckCircle size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-current" />}
                                        </button>

                                        <div className={`p-3 rounded-xl ${block.completed ? 'opacity-50' : 'bg-gray-800/50'}`}>
                                            {getIcon(block.type)}
                                        </div>
                                    </div>

                                    {/* Contenido Texto */}
                                    <div className={`flex-1 ${block.completed ? 'opacity-50' : ''}`}>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                                            <h3 className="font-bold text-lg text-gray-200">{block.title}</h3>
                                            <div className="flex items-center gap-2 text-sm font-mono text-gray-400 bg-gray-950/30 px-2 py-1 rounded">
                                                <Clock size={12} />
                                                {formatTime(block.calculatedStart as Date)} - {formatTime(block.calculatedEnd as Date)}
                                                <span className="text-gray-600">|</span>
                                                <span>{block.duration}m</span>
                                            </div>
                                        </div>

                                        {/* Mensajes de Estado */}
                                        {(block.status === 'late' || block.status === 'wait') && !block.completed && (
                                            <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${block.status === 'late' ? 'bg-red-900/50 text-red-200' : 'bg-blue-900/50 text-blue-200'}`}>
                                                {block.status === 'late' ? <AlertCircle size={12} /> : <Coffee size={12} />}
                                                {block.conflictMsg}
                                            </div>
                                        )}
                                    </div>

                                    {/* CONTROLES DE REORDENAMIENTO */}
                                    {!block.completed && (
                                        <div className="flex flex-row md:flex-col gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 md:right-2 top-4 md:top-auto">
                                            <button
                                                onClick={() => handleMoveBlock(idx, 'up')}
                                                disabled={idx === 0}
                                                className="p-1 text-gray-500 hover:text-white hover:bg-gray-700 rounded disabled:opacity-30"
                                                title="Subir bloque"
                                            >
                                                <ArrowUp size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleMoveBlock(idx, 'down')}
                                                disabled={idx === calculatedBlocks.length - 1}
                                                className="p-1 text-gray-500 hover:text-white hover:bg-gray-700 rounded disabled:opacity-30"
                                                title="Bajar bloque"
                                            >
                                                <ArrowDown size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteBlock(block.id)}
                                                className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded mt-2"
                                                title="Eliminar bloque"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Aviso Fin de Día */}
                        {isDayOverrun && (
                            <div className="mt-8 p-6 bg-red-950/30 border border-red-900/50 rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-red-900/20 rounded-full text-red-400">
                                    <Moon size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-red-400">Alerta de Sueño</h3>
                                    <p className="text-red-200/70">Tu horario termina muy tarde ({endOfDay && formatTime(endOfDay)}). Sacrifica un bloque de baja prioridad ahora para proteger tu descanso.</p>
                                </div>
                            </div>
                        )}

                        <div className="h-20"></div> {/* Espacio extra al final */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiquidPlanner;
