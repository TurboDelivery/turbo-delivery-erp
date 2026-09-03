const Footer = () => {
    return (
        <div className="p-6 pt-0 mt-auto text-center text-muted sm:ltr:text-left sm:rtl:text-right">
            © {new Date().getFullYear()}. TURBO DELIVERY All rights reserved. Developed by{' '}
            <a className="text-violet-500" href="https://www.lunion-lab.com" target="_blank" rel="noreferrer">
                LUNION-LAB
            </a>
        </div>
    );
};

export default Footer;
