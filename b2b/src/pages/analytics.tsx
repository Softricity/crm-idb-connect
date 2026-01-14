import { GetServerSideProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const Analytics = () => {
    return (
        <ProtectedRoute>
            <div>
                Analytics
            </div>
        </ProtectedRoute>
    );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {


    return {
        props:{

        }
    }
}

export default Analytics