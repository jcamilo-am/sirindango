import { EventAccountingSummaryDto } from '../../modules/events/dto/event-accounting-summary.dto';
import { LOGO_BASE64 } from './logo-base64';
import type { TDocumentDefinitions, Alignment } from 'pdfmake/interfaces';

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

export function buildEventAccountingPdf(summary: EventAccountingSummaryDto): TDocumentDefinitions {
  return {
    images: {
      logo: LOGO_BASE64
    },
    content: [
      {
        image: 'logo',
        width: 100,
        alignment: 'center' as Alignment,
        margin: [0, 0, 0, 10]
      },
      { text: 'Bienvenidos a Sirindango', style: 'orgHeader' },
      {
        text:
          '¿QUIENES SOMOS?\n' +
          'Somos una asociación de mujeres artesanas del pueblo inga, ubicada en el kilómetro 18 vía Mocoa Pitalito, en cada pieza artesanal plasmamos memoria ancestral con fibra natural, semilla y chaquira.\n\n',
        style: 'orgDescription'
      },
      { text: 'Resumen Contable del Evento', style: 'header' },
      { text: `Evento: ${summary.eventName}`, style: 'subheader' },
      { text: `Fecha: ${formatDate(summary.startDate)} - ${formatDate(summary.endDate)}` },
      { text: `Comisión Asociación: ${summary.commissionAssociationPercent}%` },
      { text: `Comisión Vendedor: ${summary.commissionSellerPercent}%` },
      { text: '\n' },

      ...summary.artisans.reduce((acc, artisan) => {
        acc.push(
          { text: `Artesano: ${artisan.artisanName}`, style: 'artisanHeader' },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
              body: [
                [
                  'Fecha',
                  'Producto',
                  'Cantidad',
                  'Valor',
                  'Método',
                  'Fee Datafono',
                  'Excedente'
                ],
                ...artisan.sales.map(sale => [
                  formatDate(sale.date),
                  sale.productName,
                  sale.quantitySold,
                  `$${sale.valueCharged.toFixed(2)}`,
                  sale.paymentMethod || '',
                  sale.cardFee?.toFixed(2) || '',
                  sale.valueDifference?.toFixed(2) || ''
                ])
              ]
            }
          },
          {
            table: {
              widths: ['*', 'auto'],
              body: [
                [{ text: 'Total vendido', bold: true }, { text: `$${artisan.totalSold.toFixed(2)}`, alignment: 'right' }],
                [{ text: 'Total fee datafono', bold: true }, { text: `$${artisan.totalCardFees.toFixed(2)}`, alignment: 'right' }],
                [{ text: 'Comisión Asociación', bold: true }, { text: `$${artisan.commissionAssociation.toFixed(2)}`, alignment: 'right' }],
                [{ text: 'Comisión Vendedor', bold: true }, { text: `$${artisan.commissionSeller.toFixed(2)}`, alignment: 'right' }],
                [{ text: 'Neto recibido', bold: true, fillColor: '#e0e0e0' }, { text: `$${artisan.netReceived.toFixed(2)}`, alignment: 'right', fillColor: '#e0e0e0' }]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 5, 0, 10]
          }
        );
        return acc;
      }, [] as any[]),

      { text: 'Totales del Evento', style: 'header', margin: [0, 10, 0, 5] },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [{ text: 'Total vendido', bold: true }, { text: `$${summary.totalSold.toFixed(2)}`, alignment: 'right' }],
            [{ text: 'Total fee datafono', bold: true }, { text: `$${summary.totalCardFees.toFixed(2)}`, alignment: 'right' }],
            [{ text: 'Comisión Asociación', bold: true }, { text: `$${summary.totalCommissionAssociation.toFixed(2)}`, alignment: 'right' }],
            [{ text: 'Comisión Vendedor', bold: true }, { text: `$${summary.totalCommissionSeller.toFixed(2)}`, alignment: 'right' }],
            [{ text: 'Neto recibido', bold: true, fillColor: '#e0e0e0' }, { text: `$${summary.totalNetReceived.toFixed(2)}`, alignment: 'right', fillColor: '#e0e0e0' }]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 10]
      }
    ],
    styles: {
      orgHeader: { fontSize: 20, bold: true, alignment: 'center' as Alignment, margin: [0, 0, 0, 8] },
      orgDescription: { fontSize: 11, alignment: 'center' as Alignment, margin: [0, 0, 0, 15] },
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      artisanHeader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] }
    }
  };
}
