/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import path from 'path';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import uploadConfig from '../config/upload';
import loadCSV from '../utils/loadCSV';

interface Request {
  transactionsFilename: string;
}

class ImportTransactionsService {
  async execute({ transactionsFilename }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(
      uploadConfig.directory,
      transactionsFilename,
    );

    const data = (await loadCSV(csvFilePath)).map(transaction => {
      return {
        title: transaction[0],
        type: transaction[1] as 'income' | 'outcome',
        value: parseFloat(transaction[2]),
        category: transaction[3],
      };
    });

    const createTransactionService = new CreateTransactionService();

    const transactions: Transaction[] = [];

    for (let i = 0; i < data.length; i++) {
      const transaction = await createTransactionService.execute(data[i]);
      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
