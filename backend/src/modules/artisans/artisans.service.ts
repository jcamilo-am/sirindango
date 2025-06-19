import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArtisanInput } from './types/create-artisan.type';
import { UpdateArtisanInput } from './types/update-artisan.type';
import { ArtisanSummarySwaggerDto, ArtisanProductSummarySwaggerDto, ArtisanSummaryContableDto, ArtisanSaleDetailDto } from './dto/artisan-product-summary.dto';

@Injectable()
export class ArtisanService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo artesano.
   * Lanza ConflictException si hay un conflicto de datos únicos.
   */
  async create(data: CreateArtisanInput) {
    try {
      return await this.prisma.artisan.create({ data });
    } catch (error) {
      // Si ocurre un error de restricción única, el filtro global lo manejará,
      // pero aquí puedes lanzar una excepción más específica si lo deseas.
      throw error;
    }
  }

  /**
   * Obtiene todos los artesanos.
   */
  async findAll() {
    return await this.prisma.artisan.findMany();
  }

  /**
   * Busca un artesano por ID.
   * Lanza NotFoundException si no existe.
   */
  async findOne(id: number) {
    const artisan = await this.prisma.artisan.findUnique({ where: { id } });
    if (!artisan) {
      // Lanzar excepción si no se encuentra el artesano
      throw new NotFoundException('El artesano no existe');
    }
    return artisan;
  }

  /**
   * Actualiza un artesano por ID.
   * Lanza NotFoundException si no existe.
   */
  async update(id: number, data: UpdateArtisanInput) {
    // 1. Verifica existencia
    const artisan = await this.prisma.artisan.findUnique({ where: { id } });
    if (!artisan) throw new NotFoundException('El artesano no existe');

    // 2. Si se intenta cambiar identificación, valida unicidad
    if (data.identification && data.identification !== artisan.identification) {
      const exists = await this.prisma.artisan.findUnique({ where: { identification: data.identification } });
      if (exists) throw new BadRequestException('Ya existe un artesano con esa identificación.');
    }

    // 3. Si se intenta cambiar nombre, valida unicidad (opcional)
    if (data.name && data.name !== artisan.name) {
      const exists = await this.prisma.artisan.findFirst({ where: { name: data.name, NOT: { id } } });
      if (exists) throw new BadRequestException('Ya existe un artesano con ese nombre.');
    }

    // 4. Si se intenta desactivar, valida que no tenga productos activos ni ventas activas
    if (data.active === false) {
      const productsCount = await this.prisma.product.count({ where: { artisanId: id } });
      if (productsCount > 0) {
        throw new BadRequestException('No se puede desactivar un artesano con productos asociados.');
      }
      const salesCount = await this.prisma.sale.count({ where: { artisanId: id, state: 'ACTIVE' } });
      if (salesCount > 0) {
        throw new BadRequestException('No se puede desactivar un artesano con ventas activas.');
      }
    }

    // 5. Actualiza
    try {
      return await this.prisma.artisan.update({ where: { id }, data });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('El artesano no existe');
      }
      throw error;
    }
  }

  /**
   * Elimina un artesano si no tiene productos ni ventas asociadas.
   * Lanza BadRequestException si tiene dependencias.
   * Lanza NotFoundException si no existe.
   */
  async remove(id: number) {
    // 1. Verificar si tiene productos asociados
    const productsCount = await this.prisma.product.count({ where: { artisanId: id } });
    if (productsCount > 0) {
      throw new BadRequestException('No se puede eliminar un artesano con productos asociados.');
    }

    // 2. Verificar si tiene ventas asociadas
    const salesCount = await this.prisma.sale.count({ where: { artisanId: id } });
    if (salesCount > 0) {
      throw new BadRequestException('No se puede eliminar un artesano con ventas asociadas.');
    }

    // 3. Verificar si tiene movimientos de inventario asociados a sus productos
    const productIds = (await this.prisma.product.findMany({ where: { artisanId: id }, select: { id: true } })).map(p => p.id);
    if (productIds.length > 0) {
      const movementsCount = await this.prisma.inventoryMovement.count({ where: { productId: { in: productIds } } });
      if (movementsCount > 0) {
        throw new BadRequestException('No se puede eliminar un artesano con movimientos de inventario asociados a sus productos.');
      }
    }

    // 4. Elimina
    try {
      return await this.prisma.artisan.delete({ where: { id } });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('El artesano no existe');
      }
      throw error;
    }
  }

  /**
   * Resumen por artesano: productos vendidos/no vendidos, total vendido, comisión, cambios.
   */
  async getSummary(artisanId: number) : Promise<ArtisanSummarySwaggerDto> {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
      include: {
        products: true,
        sales: true,
      },
    });
    if (!artisan) throw new NotFoundException('El artesano no existe');

    // Obtener todos los productos del artesano
    const products = await this.prisma.product.findMany({ where: { artisanId } });

    // Obtener todas las ventas del artesano
    const sales = await this.prisma.sale.findMany({ where: { artisanId } });

    // Obtener todos los cambios realizados por el artesano
    const changes = await this.prisma.productChange.findMany({
      where: { sale: { artisanId } },
    });

    // Obtener movimientos para calcular stock y vendidos
    const productIds = products.map(p => p.id);
    const movements = await this.prisma.inventoryMovement.findMany({
      where: { productId: { in: productIds } }
    });

    // Calcular stock y vendidos por producto
    const soldProducts: ArtisanProductSummarySwaggerDto[] = [];
    const unsoldProducts: ArtisanProductSummarySwaggerDto[] = [];
    let totalSold = 0;

    for (const product of products) {
      const productMovements = movements.filter(m => m.productId === product.id);
      const stock = productMovements.reduce((sum, m) =>
        m.type === 'ENTRADA' ? sum + m.quantity : sum - m.quantity, 0
      );
      const quantitySold = sales
        .filter(s => s.productId === product.id)
        .reduce((sum, s) => sum + s.quantitySold, 0);

      const summary: ArtisanProductSummarySwaggerDto = {
        productId: product.id,
        name: product.name,
        price: product.price,
        stock,
        quantitySold,
      };

      if (quantitySold > 0) {
        soldProducts.push(summary);
        totalSold += quantitySold * product.price;
      } else {
        unsoldProducts.push(summary);
      }
    }

    // Calcular comisión (puedes ajustar la lógica según tu modelo de comisión)
    // Aquí se asume comisión del 5% sobre total vendido
    const commission = totalSold * 0.05;

    // Cambios realizados
    const changesSummary = changes.map(change => ({
      saleId: change.saleId,
      productReturnedId: change.productReturnedId,
      productDeliveredId: change.productDeliveredId,
      quantity: change.quantity,
    }));

    return {
      artisanId: artisan.id,
      artisanName: artisan.name,
      totalSold,
      commission,
      soldProducts,
      unsoldProducts,
      changes: changesSummary,
      commissionAssociation: 0,
      commissionSeller: 0,  
    };
  }

  /**
   * Resumen por artesano y evento: productos vendidos/no vendidos, total vendido, comisiones.
   */
  async getSummaryByEvent(artisanId: number, eventId: number): Promise<ArtisanSummarySwaggerDto> {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Evento no encontrado');

    const artisan = await this.prisma.artisan.findUnique({ where: { id: artisanId } });
    if (!artisan) throw new NotFoundException('Artesano no encontrado');

    // Solo productos de ese artesano en ese evento
    const products = await this.prisma.product.findMany({ where: { artisanId, eventId } });
    const productIds = products.map(p => p.id);

    // Solo ventas de ese artesano en ese evento
    const sales = await this.prisma.sale.findMany({ where: { artisanId, eventId } });

    // Solo movimientos de esos productos en ese evento
    const movements = await this.prisma.inventoryMovement.findMany({
      where: { productId: { in: productIds } }
    });

    // Calcula stock y vendidos por producto
    const soldProducts: ArtisanProductSummarySwaggerDto[] = [];
    const unsoldProducts: ArtisanProductSummarySwaggerDto[] = [];
    let totalSold = 0;

    for (const product of products) {
      const productMovements = movements.filter(m => m.productId === product.id);
      const stock = productMovements.reduce((sum, m) =>
        m.type === 'ENTRADA' ? sum + m.quantity : sum - m.quantity, 0
      );
      const quantitySold = sales
        .filter(s => s.productId === product.id)
        .reduce((sum, s) => sum + s.quantitySold, 0);

      const summary: ArtisanProductSummarySwaggerDto = {
        productId: product.id,
        name: product.name,
        price: product.price,
        stock,
        quantitySold,
      };

      if (quantitySold > 0) {
        soldProducts.push(summary);
        totalSold += quantitySold * product.price;
      } else {
        unsoldProducts.push(summary);
      }
    }

    // Comisiones dinámicas según el evento
    const commissionAssociation = totalSold * (event.commissionAssociation / 100);
    const commissionSeller = totalSold * (event.commissionSeller / 100);

    return {
      artisanId: artisan.id,
      artisanName: artisan.name,
      totalSold,
      commissionAssociation,
      commissionSeller,
      soldProducts,
      unsoldProducts,
      commission: commissionSeller, // o la suma, según tu lógica
      changes: [], // o calcula los cambios para ese evento si lo necesitas
    };
  }

  /**
   * Resumen contable por artesano y evento: detalle de ventas, totales.
   */
  async getContableSummaryByEvent(artisanId: number, eventId: number): Promise<ArtisanSummaryContableDto> {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Evento no encontrado');

    const artisan = await this.prisma.artisan.findUnique({ where: { id: artisanId } });
    if (!artisan) throw new NotFoundException('Artesano no encontrado');

    // 1. Ventas activas (no cambiadas)
    const sales = await this.prisma.sale.findMany({
      where: { artisanId, eventId, state: 'ACTIVE' },
      include: { product: true },
      orderBy: { date: 'asc' }
    });

    // 2. Cambios realizados por este artesano en este evento
    const productChanges = await this.prisma.productChange.findMany({
      where: {
        sale: { artisanId, eventId }
      },
      include: {
        deliveredProduct: true,
        returnedProduct: true,
        sale: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    // 3. Detalle de ventas activas
    const salesDetails: ArtisanSaleDetailDto[] = sales.map(sale => ({
      saleId: sale.id,
      date: sale.date,
      productId: sale.productId,
      productName: sale.product.name,
      quantitySold: sale.quantitySold,
      valueCharged: sale.valueCharged,
      paymentMethod: sale.paymentMethod,
      cardFee: sale.cardFee ?? 0,
      type: 'VENTA'
    }));

    // 4. Detalle de cambios
    const changesDetails: ArtisanSaleDetailDto[] = productChanges.map(change => ({
      saleId: change.saleId,
      date: change.createdAt,
      productId: change.productDeliveredId,
      productName: change.deliveredProduct.name,
      quantitySold: change.quantity,
      valueCharged: change.deliveredProductPrice * change.quantity,
      paymentMethod: change.paymentMethodDifference === 'CASH' || change.paymentMethodDifference === 'CARD'
        ? change.paymentMethodDifference as 'CASH' | 'CARD'
        : undefined,
      cardFee: change.cardFeeDifference ?? 0,
      type: 'CAMBIO',
      valueDifference: change.valueDifference ?? 0
    }));

    // 5. Unir detalles
    const allDetails = [...salesDetails, ...changesDetails].sort((a, b) => a.date.getTime() - b.date.getTime());

    // 6. Totales
    const totalSold = sales.reduce((sum, s) => sum + s.valueCharged, 0)
      + productChanges.reduce((sum, c) => sum + (c.deliveredProductPrice * c.quantity), 0);

    const totalCardFees = sales
      .filter(s => s.paymentMethod === 'CARD')
      .reduce((sum, s) => sum + (s.cardFee ?? 0), 0)
      + productChanges.reduce((sum, c) => sum + (c.cardFeeDifference ?? 0), 0);

    const commissionAssociation = totalSold * (event.commissionAssociation / 100);
    const commissionSeller = totalSold * (event.commissionSeller / 100);

    const netReceived = totalSold - commissionAssociation - commissionSeller - totalCardFees;

    return {
      sales: allDetails,
      totalSold,
      totalCardFees,
      commissionAssociation,
      commissionSeller,
      netReceived,
    };
  }
}