import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import { join } from 'path';

@Injectable()
export class OpenTdbService {
  private readonly logger = new Logger(OpenTdbService.name);

  @Cron('0 0 * * *')
  handleCron() {
    this.logger.log('Exécution du script Python ...');
    const scriptDir = join(
      __dirname,
      '..',
      '..',
      'scripts',
      'opentdb'
    );
    const scriptPath = join(scriptDir, 'opentdb_fetch.py');
    exec(`python "${scriptPath}"`, { cwd: scriptDir }, (error, stdout, stderr) => {
      if (error) {
        this.logger.error(`Erreur: ${error.message}`);
        return;
      }
      if (stderr) {
        this.logger.warn(`Stderr: ${stderr}`);
      }
      this.logger.log(`Sortie: ${stdout}`);
    });
  }
}
