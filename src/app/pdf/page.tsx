'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ArrowLeft, ArrowRight, Minus, Plus } from 'lucide-react';

// Configurar el worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PDF_URL = 'https://pub-8bfd9224ce81402aa8c9227ae6aa5971.r2.dev/FAE5_Art-x-Creative-RD.25.06.23.pdf';
const PROXY_URL = `/api/pdf-proxy?url=${encodeURIComponent(PDF_URL)}`;

export default function PDFViewer() {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Función para calcular las dimensiones del contenedor del PDF (div verde)
  const updateContainerDimensions = () => {
    if (pdfContainerRef.current) {
      const rect = pdfContainerRef.current.getBoundingClientRect();
      setContainerWidth(rect.width);
      setContainerHeight(rect.height);
    }
  };

  // Effect para calcular dimensiones iniciales y en resize
  useEffect(() => {
    updateContainerDimensions();
    
    const handleResize = () => {
      updateContainerDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoadError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setLoadError(error.message);
  }

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 2, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 2, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.3, 5.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.3, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
  };

  return (
    <div className="h-full w-full backdrop-blur-lg rounded-lg">
      <div className="mx-auto flex flex-col justify-center items-center w-full h-full">

        {/* Contenedor del PDF */}
        <div 
          ref={containerRef}
          className="flex-1 w-full h-full rounded-lg p-4"
        >
          <div 
            ref={pdfContainerRef}
            className="flex h-full justify-center"
          >
            <Document
              file={PROXY_URL}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center w-full h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando PDF...</p>
                  </div>
                </div>
              }
              error={
                <div className="flex items-center justify-center h-96">
                  <div className="text-center text-red-600">
                    <p className="text-lg font-semibold mb-2">Error al cargar el PDF</p>
                    <p className="text-sm mb-4">
                      {loadError || 'Error al cargar el documento'}
                    </p>
                  </div>
                </div>
              }
            >
              <div className="flex gap-4 justify-center">
                {[pageNumber, pageNumber + 1].map((pageNum) => (
                  pageNum <= numPages && (
                    <Page
                      key={pageNum}
                      pageNumber={pageNum}
                      scale={scale}
                      height={containerHeight}
                      loading={
                        <div className="flex items-center justify-center h-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                      }
                      className="shadow-lg"
                    />
                  )
                ))}
              </div>

            </Document>
          </div>
        </div>


                {/* Header con controles */}
        <div className="rounded-lg w-full p-4 mb-4">
          
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              {/* Navegación de páginas */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="p-2 bg-white border border-black rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                
                <span className="text-sm text-gray-600">
                         {pageNumber}-{Math.min(pageNumber + 1, numPages)} / {numPages}
                </span>
                
                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="p-2 bg-white border border-black rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Controles de zoom */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={zoomOut}
                  className="p-2 bg-white border border-black rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                
                <button
                  onClick={zoomIn}
                  className="p-2 bg-white border border-black rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
