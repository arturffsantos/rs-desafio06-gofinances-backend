import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: 'string';
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category: categoryTitle,
  }: Request): Promise<Transaction> {
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError(
        'Invalid transaction type. Must be income or outcome',
        404,
      );
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (type === 'outcome') {
      const {
        total: currentBalance,
      } = await transactionsRepository.getBalance();

      if (currentBalance - value < 0) {
        throw new AppError('Insuficient funds', 400);
      }
    }

    const categoriesRepository = getRepository(Category);

    const categoryExists = await categoriesRepository
      .createQueryBuilder()
      .where('LOWER(title) = LOWER(:categoryTitle)', { categoryTitle })
      .getOne();

    let category: Category;

    if (categoryExists) {
      category = categoryExists;
    } else {
      category = categoriesRepository.create({
        title: categoryTitle,
      });

      category = await categoriesRepository.save(category);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: category.id,
    });

    await transactionsRepository.save(transaction);
    transaction.category = category;

    return transaction;
  }
}

export default CreateTransactionService;
