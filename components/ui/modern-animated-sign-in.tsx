'use client';
import {
    memo,
    ReactNode,
    useState,
    ChangeEvent,
    FormEvent,
    useEffect,
    useRef,
    forwardRef,
} from 'react';
import {
    motion,
    useAnimation,
    useInView,
    useMotionTemplate,
    useMotionValue,
} from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { Platform } from 'react-native';

const clsx = (...classes: any[]) => classes.filter(Boolean).join(' ');
const cn = clsx; // Simple utility replacing tailwind-merge to avoid extra deps

// ==================== Input Component ====================

const Input = memo(
    forwardRef(function Input(
        { className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>,
        ref: React.ForwardedRef<HTMLInputElement>
    ) {
        const radius = 100; // change this to increase the radius of the hover effect
        const [visible, setVisible] = useState(false);

        const mouseX = useMotionValue(0);
        const mouseY = useMotionValue(0);

        function handleMouseMove({
            currentTarget,
            clientX,
            clientY,
        }: React.MouseEvent<HTMLDivElement>) {
            const { left, top } = currentTarget.getBoundingClientRect();

            mouseX.set(clientX - left);
            mouseY.set(clientY - top);
        }

        return (
            <motion.div
                style={{
                    background: useMotionTemplate`
        radial-gradient(
          ${visible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
          rgba(201,166,70,0.6),
          transparent 80%
        )
      `,
                }}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                className='group/input rounded-lg p-[2px] transition duration-300'
            >
                <input
                    type={type}
                    className={cn(
                        `flex h-12 w-full rounded-md px-4 py-3 text-[15px] tracking-wide transition duration-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50`,
                        className
                    )}
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(184,150,46,0.30)',
                        color: '#F5EED5',
                        letterSpacing: '0.5px',
                        borderRadius: '10px',
                    }}
                    ref={ref as any}
                    {...props}
                />
            </motion.div>
        );
    })
);

Input.displayName = 'Input';

// ==================== BoxReveal Component ====================

type BoxRevealProps = {
    children: ReactNode;
    width?: string;
    boxColor?: string;
    duration?: number;
    overflow?: string;
    position?: string;
    className?: string;
};

const BoxReveal = memo(function BoxReveal({
    children,
    width = 'fit-content',
    boxColor,
    duration,
    overflow = 'hidden',
    position = 'relative',
    className,
}: BoxRevealProps) {
    const mainControls = useAnimation();
    const slideControls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (isInView) {
            slideControls.start('visible');
            mainControls.start('visible');
        } else {
            slideControls.start('hidden');
            mainControls.start('hidden');
        }
    }, [isInView, mainControls, slideControls]);

    return (
        <section
            ref={ref}
            style={{
                position: position as
                    | 'relative'
                    | 'absolute'
                    | 'fixed'
                    | 'sticky'
                    | 'static',
                width,
                overflow,
            }}
            className={className}
        >
            <motion.div
                variants={{
                    hidden: { opacity: 0, y: 75 },
                    visible: { opacity: 1, y: 0 },
                }}
                initial='hidden'
                animate={mainControls}
                transition={{ duration: duration ?? 0.5, delay: 0.25 }}
            >
                {children}
            </motion.div>
            <motion.div
                variants={{ hidden: { left: 0 }, visible: { left: '100%' } }}
                initial='hidden'
                animate={slideControls}
                transition={{ duration: duration ?? 0.5, ease: 'easeIn' }}
                style={{
                    position: 'absolute',
                    top: 4,
                    bottom: 4,
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    background: boxColor ?? '#C9A646',
                    borderRadius: 4,
                }}
            />
        </section>
    );
});

// ==================== Ripple Component ====================

type RippleProps = {
    mainCircleSize?: number;
    mainCircleOpacity?: number;
    numCircles?: number;
    className?: string;
};

const Ripple = memo(function Ripple({
    mainCircleSize = 210,
    mainCircleOpacity = 0.24,
    numCircles = 11,
    className = '',
}: RippleProps) {
    return (
        <section
            className={`max-w-[50%] absolute inset-0 flex items-center justify-center
        dark:bg-white/5 bg-neutral-50
        [mask-image:linear-gradient(to_bottom,black,transparent)]
        dark:[mask-image:linear-gradient(to_bottom,white,transparent)] ${className}`}
        >
            {Array.from({ length: numCircles }, (_, i) => {
                const size = mainCircleSize + i * 70;
                const opacity = mainCircleOpacity - i * 0.03;
                const animationDelay = `${i * 0.06}s`;
                const borderStyle = i === numCircles - 1 ? 'dashed' : 'solid';
                const borderOpacity = 5 + i * 5;

                return (
                    <span
                        key={i}
                        className='absolute animate-ripple rounded-full bg-foreground/15 border'
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            opacity: opacity,
                            animationDelay: animationDelay,
                            borderStyle: borderStyle,
                            borderWidth: '1px',
                            borderColor: `color-mix(in srgb, var(--foreground) ${borderOpacity}%, transparent)`,
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                );
            })}
        </section>
    );
});

// ==================== OrbitingCircles Component ====================

type OrbitingCirclesProps = {
    className?: string;
    children: ReactNode;
    reverse?: boolean;
    duration?: number;
    delay?: number;
    radius?: number;
    path?: boolean;
};

const OrbitingCircles = memo(function OrbitingCircles({
    className,
    children,
    reverse = false,
    duration = 20,
    delay = 10,
    radius = 50,
    path = true,
}: OrbitingCirclesProps) {
    return (
        <>
            {path && (
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    version='1.1'
                    className='pointer-events-none absolute inset-0 size-full'
                >
                    <circle
                        className='stroke-black/10 stroke-1 dark:stroke-white/10'
                        cx='50%'
                        cy='50%'
                        r={radius}
                        fill='none'
                    />
                </svg>
            )}
            <section
                style={
                    {
                        '--duration': duration,
                        '--radius': radius,
                        '--delay': -delay,
                    } as React.CSSProperties
                }
                className={cn(
                    'absolute flex size-full transform-gpu animate-orbit items-center justify-center rounded-full border bg-black/10 [animation-delay:calc(var(--delay)*1000ms)] dark:bg-white/10',
                    className
                )}
            >
                {children}
            </section>
        </>
    );
});

// ==================== TechOrbitDisplay Component ====================

type IconConfig = {
    className?: string;
    duration?: number;
    delay?: number;
    radius?: number;
    path?: boolean;
    reverse?: boolean;
    component: () => React.ReactNode;
};

type TechnologyOrbitDisplayProps = {
    iconsArray: IconConfig[];
    text?: string;
};

const TechOrbitDisplay = memo(function TechOrbitDisplay({
    iconsArray,
    text = 'Animated Login',
}: TechnologyOrbitDisplayProps) {
    return (
        <section className='relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg'>
            <span className='pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-7xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10'>
                {text}
            </span>

            {iconsArray.map((icon, index) => (
                <OrbitingCircles
                    key={index}
                    className={icon.className}
                    duration={icon.duration}
                    delay={icon.delay}
                    radius={icon.radius}
                    path={icon.path}
                    reverse={icon.reverse}
                >
                    {icon.component()}
                </OrbitingCircles>
            ))}
        </section>
    );
});

// ==================== AnimatedForm Component ====================

type FieldType = 'text' | 'email' | 'password';

type Field = {
    label: string;
    required?: boolean;
    type: FieldType;
    placeholder?: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type AnimatedFormProps = {
    header: string;
    subHeader?: string;
    fields: Field[];
    submitButton: string;
    textVariantButton?: string;
    errorField?: string;
    fieldPerRow?: number;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    googleLogin?: string;
    goTo?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

type Errors = {
    [key: string]: string;
};

const AnimatedForm = memo(function AnimatedForm({
    header,
    subHeader,
    fields,
    submitButton,
    textVariantButton,
    errorField,
    fieldPerRow = 1,
    onSubmit,
    googleLogin,
    goTo,
}: AnimatedFormProps) {
    const [visible, setVisible] = useState<boolean>(false);
    const [errors, setErrors] = useState<Errors>({});

    const toggleVisibility = () => setVisible(!visible);

    const validateForm = (event: FormEvent<HTMLFormElement>) => {
        const currentErrors: Errors = {};
        fields.forEach((field) => {
            const value = (event.target as HTMLFormElement)[field.label]?.value;

            if (field.required && !value) {
                currentErrors[field.label] = `${field.label} is required`;
            }

            if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
                currentErrors[field.label] = 'Invalid email address';
            }

            if (field.type === 'password' && value && value.length < 6) {
                currentErrors[field.label] =
                    'Password must be at least 6 characters long';
            }
        });
        return currentErrors;
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formErrors = validateForm(event);

        if (Object.keys(formErrors).length === 0) {
            onSubmit(event);
            console.log('Form submitted');
        } else {
            setErrors(formErrors);
        }
    };

    return (
        <section className='w-full flex flex-col gap-6' style={{ maxWidth: 440, margin: '0 auto' }}>
            <BoxReveal boxColor='rgba(201,166,70,0.3)' duration={0.3}>
                <h2 style={{ color: '#F5EED5', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '36px', fontWeight: 300, letterSpacing: '0.5px', lineHeight: 1.2 }}>
                    {header}
                </h2>
            </BoxReveal>

            {subHeader && (
                <BoxReveal boxColor='rgba(201,166,70,0.3)' duration={0.3} className='pb-3'>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', letterSpacing: '0.3px', fontWeight: 300 }}>
                        {subHeader}
                    </p>
                </BoxReveal>
            )}

            {googleLogin && (
                <>
                    <BoxReveal
                        boxColor='rgba(201,166,70,0.3)'
                        duration={0.3}
                        overflow='visible'
                        width='unset'
                    >
                        <button
                            className='g-button group/btn bg-transparent w-full font-medium outline-hidden hover:cursor-pointer transition-all duration-300 hover:bg-[rgba(201,166,70,0.06)]'
                            style={{ border: '1px solid rgba(184,150,46,0.30)', color: '#F5EED5', height: '50px', borderRadius: '10px' }}
                            type='button'
                            onClick={() => console.log('Google login clicked')}
                        >
                            <span className='flex items-center justify-center w-full h-full gap-3 tracking-wider text-[14px]'>
                                <img
                                    src='https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png'
                                    width={24}
                                    height={24}
                                    alt='Google Icon'
                                />
                                {googleLogin}
                            </span>

                            <BottomGradient />
                        </button>
                    </BoxReveal>

                    <BoxReveal boxColor='rgba(201,166,70,0.3)' duration={0.3} width='100%'>
                        <section className='flex items-center gap-4'>
                            <hr className='flex-1 border-1 border-dashed' style={{ borderColor: 'rgba(184,150,46,0.25)' }} />
                            <p className='text-sm tracking-widest' style={{ color: 'rgba(255,255,255,0.4)' }}>
                                or
                            </p>
                            <hr className='flex-1 border-1 border-dashed' style={{ borderColor: 'rgba(184,150,46,0.25)' }} />
                        </section>
                    </BoxReveal>
                </>
            )}

            <form onSubmit={handleSubmit}>
                <section
                    className={`grid grid-cols-1 md:grid-cols-${fieldPerRow} mb-6`}
                >
                    {fields.map((field) => (
                        <section key={field.label} className='flex flex-col gap-2'>
                            <BoxReveal boxColor='rgba(201,166,70,0.3)' duration={0.3}>
                                <Label htmlFor={field.label} style={{ color: '#C9A646', letterSpacing: '1.5px', fontSize: '12px', textTransform: 'uppercase' } as any}>
                                    {field.label} <span style={{ color: '#d4564e' }}>*</span>
                                </Label>
                            </BoxReveal>

                            <BoxReveal
                                width='100%'
                                boxColor='rgba(201,166,70,0.3)'
                                duration={0.3}
                                className='flex flex-col space-y-2 w-full'
                            >
                                <section className='relative'>
                                    <Input
                                        type={
                                            field.type === 'password'
                                                ? visible
                                                    ? 'text'
                                                    : 'password'
                                                : field.type
                                        }
                                        id={field.label}
                                        placeholder={field.placeholder}
                                        onChange={field.onChange}
                                    />

                                    {field.type === 'password' && (
                                        <button
                                            type='button'
                                            onClick={toggleVisibility}
                                            className='absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5'
                                            style={{ color: 'rgba(201,166,70,0.5)' }}
                                        >
                                            {visible ? (
                                                <Eye className='h-5 w-5' />
                                            ) : (
                                                <EyeOff className='h-5 w-5' />
                                            )}
                                        </button>
                                    )}
                                </section>

                                <section className='h-4'>
                                    {errors[field.label] && (
                                        <p className='text-red-500 text-xs'>
                                            {errors[field.label]}
                                        </p>
                                    )}
                                </section>
                            </BoxReveal>
                        </section>
                    ))}
                </section>

                <BoxReveal width='100%' boxColor='rgba(201,166,70,0.3)' duration={0.3}>
                    {errorField && (
                        <p className='text-red-500 text-sm mb-4'>{errorField}</p>
                    )}
                </BoxReveal>

                <BoxReveal
                    width='100%'
                    boxColor='rgba(201,166,70,0.3)'
                    duration={0.3}
                    overflow='visible'
                >
                    <button
                        className='relative group/btn block w-full outline-hidden hover:cursor-pointer transition-all duration-300 hover:brightness-110 active:scale-[0.98]'
                        style={{
                            background: 'linear-gradient(180deg, #dbb84d 0%, #c9a646 30%, #b8962e 60%, #a6842a 85%, #c9a646 100%)',
                            boxShadow: '0 8px 28px rgba(201,166,70,0.35), 0 2px 8px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -2px 4px rgba(0,0,0,0.1)',
                            color: '#1a1200',
                            fontSize: '14px',
                            fontWeight: 700,
                            letterSpacing: '5px',
                            height: '54px',
                            borderRadius: '10px',
                        }}
                        type='submit'
                    >
                        {submitButton}
                        <BottomGradient />
                    </button>
                </BoxReveal>

                {textVariantButton && goTo && (
                    <BoxReveal boxColor='rgba(201,166,70,0.3)' duration={0.3}>
                        <section className='mt-5 text-center hover:cursor-pointer'>
                            <button
                                className='text-sm hover:cursor-pointer outline-hidden transition-colors duration-300 tracking-wider'
                                style={{ color: '#C9A646' }}
                                onClick={goTo}
                            >
                                {textVariantButton}
                            </button>
                        </section>
                    </BoxReveal>
                )}
            </form>
        </section>
    );
});

const BottomGradient = () => {
    return (
        <>
            <span className='group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent' />
            <span className='group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-[#C9A646] to-transparent' />
        </>
    );
};

// ==================== AuthTabs Component ====================

interface AuthTabsProps {
    formFields: {
        header: string;
        subHeader?: string;
        fields: Array<{
            label: string;
            required?: boolean;
            type: FieldType;
            placeholder: string;
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
        }>;
        submitButton: string;
        textVariantButton?: string;
    };
    goTo: (event: React.MouseEvent<HTMLButtonElement>) => void;
    handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const AuthTabs = memo(function AuthTabs({
    formFields,
    goTo,
    handleSubmit,
}: AuthTabsProps) {
    return (
        <div className='w-full z-[200] relative'>
            <AnimatedForm
                {...formFields}
                fieldPerRow={1}
                onSubmit={handleSubmit}
                goTo={goTo}
                googleLogin='Login with Google'
            />
        </div>
    );
});

// ==================== Label Component ====================

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    htmlFor?: string;
}

const Label = memo(function Label({ className, ...props }: LabelProps) {
    return (
        <label
            className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                className
            )}
            {...props}
        />
    );
});

// ==================== Exports ====================

export {
    Input,
    BoxReveal,
    Ripple,
    OrbitingCircles,
    TechOrbitDisplay,
    AnimatedForm,
    AuthTabs,
    Label,
    BottomGradient,
};
