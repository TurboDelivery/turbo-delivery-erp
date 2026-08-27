'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { usePopper } from 'react-popper';

const Dropdown = (props: any, forwardedRef: any) => {
    const [visibility, setVisibility] = useState<any>(false);

    // `useRef<T>()` sans argument n'est plus accepte par les types de React 19 :
    // la surcharge exige une valeur initiale. `null` est ce que le code suppose
    // deja partout ailleurs, et le passer ne change RIEN en React 18. C'est le
    // correctif du lot 5 qui peut partir des aujourd'hui.
    const referenceRef = useRef<any>(null);
    const popperRef = useRef<any>(null);

    const { styles, attributes } = usePopper(referenceRef.current, popperRef.current, {
        placement: props.placement || 'bottom-end',
        modifiers: [
            {
                name: 'offset',
                options: {
                    offset: props.offset || [0],
                },
            },
        ],
    });

    const handleDocumentClick = (event: any) => {
        if (referenceRef.current.contains(event.target) || popperRef.current.contains(event.target)) {
            return;
        }

        setVisibility(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleDocumentClick);
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, []);

    useImperativeHandle(forwardedRef, () => ({
        close() {
            setVisibility(false);
        },
    }));

    return (
        <>
            <button ref={referenceRef} type="button" className={props.btnClassName} onClick={() => setVisibility(!visibility)}>
                {props.button}
            </button>

            <div ref={popperRef} style={styles.popper} {...attributes.popper} className="z-50" onClick={() => setVisibility(!visibility)}>
                {visibility && props.children}
            </div>
        </>
    );
};

export default forwardRef(Dropdown);
