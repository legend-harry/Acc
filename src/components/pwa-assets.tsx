
'use client';

export function PwaAssets() {
    return (
        <>
            <meta name="application-name" content="ExpenseWise" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="apple-mobile-web-app-title" content="ExpenseWise" />
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="msapplication-config" content="/icons/browserconfig.xml" />
            <meta name="msapplication-TileColor" content="#3CB371" />
            <meta name="msapplication-tap-highlight" content="no" />
            <meta name="theme-color" content="#3CB371" />

            <link rel="apple-touch-icon" href="/Fintrack(logo).png" />
            
            {/* You can add more sizes for apple-touch-icon if you have them */}
            {/* <link rel="apple-touch-icon" sizes="152x152" href="/icons/touch-icon-ipad.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/icons/touch-icon-iphone-retina.png" />
            <link rel="apple-touch-icon" sizes="167x167" href="/icons/touch-icon-ipad-retina.png" /> */}

            <link rel="icon" type="image/png" sizes="32x32" href="/Fintrack(logo).png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/Fintrack(logo).png" />
            
            <link rel="mask-icon" href="/Fintrack(logo).png" color="#3CB371" />
            <link rel="shortcut icon" href="/Fintrack(logo).png" />

            {/* <link rel="manifest" href="/manifest.json" /> This is now in metadata */}

            {/* 
            You may want to create startup images for a better user experience.
            <link rel="apple-touch-startup-image" href="/images/apple_splash_2048.png" sizes="2048x2732" />
            ... more splash screens
            */}
        </>
    );
}
