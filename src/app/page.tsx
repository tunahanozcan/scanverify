import BarcodeScanner from '@/components/barcode-scanner';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">
          ScanVerify
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Point your camera at a barcode to verify its serial number instantly.
        </p>
      </div>
      <BarcodeScanner />
    </main>
  );
}
