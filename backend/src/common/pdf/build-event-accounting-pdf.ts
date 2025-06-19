import { EventAccountingSummaryDto } from '../../modules/events/dto/event-accounting-summary.dto';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { LOGO_BASE64 } from './logo-base64';

export function buildEventAccountingPdf(summary: EventAccountingSummaryDto): TDocumentDefinitions {
  const currentDate = new Date();

  return {
    images: {
      logo: LOGO_BASE64
    },
    header: {
      columns: [
        {
          image: 'logo',
          width: 50,
          alignment: 'left'
        },
        {
          stack: [
            { text: 'ASOCIACION DE ARTESANOS "IUIAI WASI"', alignment: 'center', style: 'orgHeader' },
            { text: 'Resguardo Inga de Condagua', alignment: 'center', style: 'orgSubHeader' }
          ],
          alignment: 'center',
          margin: [0, 10, 0, 0]
        }
      ],
      margin: [40, 10, 40, 0]
    },
    pageMargins: [40, 80, 40, 40],
    footer: function (currentPage, pageCount) {
      return {
        columns: [
          {
            text: 'Asociación IUIAI WASI – Km 18 vía Mocoa – Pitalito, Putumayo, Colombia',
            alignment: 'left',
            fontSize: 8,
            margin: [40, 0, 0, 0]
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: 'center',
            fontSize: 8
          },
          {
            text: `Generado por Sirindango – ${formatDate(currentDate)}`,
            alignment: 'right',
            fontSize: 8,
            margin: [0, 0, 40, 0]
          }
        ],
        margin: [40, 10]
      };
    },
    content: [
      { text: 'RESUMEN CONTABLE DEL EVENTO', style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },
      { text: `Evento: ${summary.eventName}`, style: 'subheader' },
      { text: `Fecha: ${formatDate(summary.startDate)} - ${formatDate(summary.endDate)}` },
      { text: `Comisión Asociación: ${summary.commissionAssociationPercent}%` },
      { text: `Comisión Vendedor: ${summary.commissionSellerPercent}%` },
      { text: '\n' },

      // El resto del contenido como ya lo tenés (ventas por artesano, totales...)
      // No necesitas modificar eso si ya funciona bien
      ...summary.artisans.reduce((acc, artisan) => {
        acc.push(
          { 
            text: [
              { text: `Artesano: ${artisan.artisanName}\n`, bold: true },
              { text: `Identificación: ${artisan.artisanIdentification || 'N/A'}` }
            ],
            style: 'artisanHeader'
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
              body: [
                [
                  'Fecha',
                  'Producto',
                  'Cantidad',
                  'Precio Unitario',
                  'Valor Total',
                  'Método',
                  'Fee Datafono'
                ],
                ...artisan.sales.map(sale => [
                  formatDate(sale.date),
                  sale.productName,
                  sale.quantitySold,
                  `$${sale.unitPrice.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
                  `$${sale.valueCharged.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
                  sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'CARD' ? 'Tarjeta' : (sale.paymentMethod || ''),
                  sale.cardFee ? sale.cardFee.toLocaleString('es-CO', { minimumFractionDigits: 2 }) : ''
                ])
              ]
            }
          },
          {
            table: {
              widths: ['*', 'auto'],
              body: [
                [{ text: 'Total vendido', bold: true }, { text: `$${artisan.totalSold.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, alignment: 'right' }],
                [{ text: 'Total fee datafono', bold: true }, { text: `$${artisan.totalCardFees.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, alignment: 'right' }],
                [{ text: 'Comisión Asociación', bold: true }, { text: `$${artisan.commissionAssociation.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, alignment: 'right' }],
                [{ text: 'Comisión Vendedor', bold: true }, { text: `$${artisan.commissionSeller.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, alignment: 'right' }],
                [{ text: 'Neto recibido', bold: true, fillColor: '#e0e0e0' }, { text: `$${artisan.netReceived.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, alignment: 'right', fillColor: '#e0e0e0' }]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 5, 0, 10]
          }
        );
        return acc;
      }, [] as any[]),

      { text: 'TOTALES DEL EVENTO', style: 'header', alignment: 'center', margin: [0, 10, 0, 5] },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [{ text: 'Total vendido', bold: true }, { text: `$${summary.totalSold.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, alignment: 'right' }],
            [{ text: 'Total fee datafono', bold: true }, { text: `$${summary.totalCardFees.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, alignment: 'right' }],
            [{ text: 'Comisión Asociación', bold: true }, { text: `$${summary.totalCommissionAssociation.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, alignment: 'right' }],
            [{ text: 'Comisión Vendedor', bold: true }, { text: `$${summary.totalCommissionSeller.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, alignment: 'right' }],
            [{ text: 'Neto recibido', bold: true, fillColor: '#e0e0e0' }, { text: `$${summary.totalNetReceived.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`, alignment: 'right', fillColor: '#e0e0e0' }]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 10]
      }
    ],
    styles: {
      orgHeader: { fontSize: 12, bold: true },
      orgSubHeader: { fontSize: 10, italics: true },
      header: { fontSize: 13, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
      artisanHeader: { fontSize: 11, bold: true, margin: [0, 10, 0, 5] }
    }
  };
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}
