import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './types/create-product.type';
import { UpdateProductInput } from './types/update-product.type';
import { FindAllOptions } from './types/filters.type';
import { ProductValidationHelper } from './helpers/product-validation.helper';
import { ProductStockHelper } from './helpers/product-stock.helper';

@Injectable()
export class ProductService {
  private validationHelper: ProductValidationHelper;

  constructor(private prisma: PrismaService) {
    this.validationHelper = new ProductValidationHelper(prisma);
  }

  /**
   * Crea un producto y su movimiento de inventario inicial.
   */
  async create(data: CreateProductInput) {
    // Validaciones previas
    await this.validationHelper.validateEventEditable(data.eventId);
    await this.validationHelper.validateEvent({ eventId: data.eventId });
    await this.validationHelper.validateArtisan(data.artisanId);
    await this.validationHelper.validateUniqueProductName(
      data.name,
      data.eventId,
      data.artisanId,
    );

    return await this.prisma.$transaction(async (tx) => {
      const { initialQuantity, ...productData } = data;

      // Crear el producto
      const product = await tx.product.create({ data: productData });

      // Crear movimiento de inventario inicial
      await tx.inventoryMovement.create({
        data: {
          type: 'ENTRADA',
          quantity: initialQuantity,
          reason: 'Carga inicial',
          productId: product.id,
        },
      });

      // Retornar producto con stock calculado
      const stock = await ProductStockHelper.getCurrentStockWithClient(
        product.id,
        tx,
      );
      return { ...product, stock };
    });
  }

  /**
   * Obtiene el stock actual de un producto.
   * Método público para consultas directas.
   */
  async getCurrentStock(productId: number): Promise<number> {
    return ProductStockHelper.getCurrentStock(productId, this.prisma);
  }

  /**
   * Busca productos con filtros opcionales y retorna el stock calculado.
   */
  async findAll(options: FindAllOptions = {}) {
    const { eventId, artisanId, order } = options;
    const where: any = {};

    if (eventId) where.eventId = eventId;
    if (artisanId) where.artisanId = artisanId;

    // Solo incluir productos de eventos no cerrados
    where.event = { state: { not: 'CLOSED' } };

    let orderBy: any = undefined;
    if (order === 'name') orderBy = { name: 'asc' };

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      include: { event: true },
    });

    return ProductStockHelper.addStockToProducts(products, this.prisma);
  }

  /**
   * Busca un producto por ID.
   */
  async findOne(id: number) {
    await this.validationHelper.validateProductExists(id);

    const product = await this.prisma.product.findUnique({ where: { id } });
    return ProductStockHelper.addStockToProduct(product!, this.prisma);
  }

  /**
   * Actualiza un producto.
   */
  async update(id: number, data: UpdateProductInput) {
    await this.validationHelper.validateProductExists(id);

    const product = await this.prisma.product.findUnique({ where: { id } });

    // Validar evento editable
    await this.validationHelper.validateEventEditable(
      data.eventId ?? product!.eventId,
    );

    // Validar unicidad de nombre si cambia
    if (data.name) {
      await this.validationHelper.validateUniqueProductName(
        data.name,
        data.eventId ?? product!.eventId,
        data.artisanId ?? product!.artisanId,
        id,
      );
    }

    // Validar evento y artesano si cambian
    if (data.eventId) {
      await this.validationHelper.validateEvent({ eventId: data.eventId });
    }
    if (data.artisanId) {
      await this.validationHelper.validateArtisan(data.artisanId);
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data,
    });
    return ProductStockHelper.addStockToProduct(updatedProduct, this.prisma);
  }

  /**
   * Elimina un producto solo si no tiene movimientos de inventario.
   */
  async remove(id: number) {
    await this.validationHelper.validateProductExists(id);

    const product = await this.prisma.product.findUnique({ where: { id } });
    await this.validationHelper.validateEventEditable(product!.eventId);

    const movementsCount = await this.prisma.inventoryMovement.count({
      where: { productId: id },
    });

    if (movementsCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar un producto con movimientos de inventario',
      );
    }

    return await this.prisma.product.delete({ where: { id } });
  }
}
