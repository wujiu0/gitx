import { exec } from 'child_process';
import { promisify } from 'util';
import { Branch, Commit, FileChange } from '../types.js';

const execAsync = promisify(exec);

export class GitService {
  private cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  private async execute(command: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`git ${command}`, { cwd: this.cwd });
      return stdout.trim();
    } catch (error) {
      console.error(`Git command failed: git ${command}`, error);
      throw error;
    }
  }

  async getLog(maxCount: number = 100): Promise<Commit[]> {
    const SEP = '||SEP||';
    const format = `%H${SEP}%s${SEP}%an${SEP}%ad`;
    const stdout = await this.execute(`log -n ${maxCount} --pretty=format:"${format}" --date=iso`);

    if (!stdout) {
      return [];
    }

    return stdout.split('\n').map((line) => {
      const [hash, message, author, date] = line.split(SEP);
      return {
        hash,
        message,
        author,
        date,
      };
    });
  }

  async getBranches(): Promise<Branch[]> {
    const stdout = await this.execute('branch -a');
    if (!stdout) {
      return [];
    }

    return stdout
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const current = line.startsWith('*');
        let name = line.replace('*', '').trim();
        let type: 'local' | 'remote' = 'local';

        if (name.startsWith('remotes/')) {
          name = name.replace('remotes/', '');
          type = 'remote';
        }

        return {
          name,
          type,
          current,
        };
      });
  }

  async getCommitFiles(hash: string): Promise<FileChange[]> {
    const stdout = await this.execute(`show --name-status --pretty=format: ${hash}`);
    return stdout
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const [status, name] = line.split('\t');
        return {
          name,
          status: status as any,
        };
      });
  }
}
